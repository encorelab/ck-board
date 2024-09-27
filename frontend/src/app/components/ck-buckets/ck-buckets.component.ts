import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { ComponentType } from '@angular/cdk/portal';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
import { ActivatedRoute, Router } from '@angular/router';
import { Board, BoardScope, ViewType } from 'src/app/models/board';
import { Project } from 'src/app/models/project';
import { AuthUser, Role } from 'src/app/models/user';
import { BoardService } from 'src/app/services/board.service';
import { BucketService } from 'src/app/services/bucket.service';
import { CommentService } from 'src/app/services/comment.service';
import { PostService } from 'src/app/services/post.service';
import { ProjectService } from 'src/app/services/project.service';
import { UpvotesService } from 'src/app/services/upvotes.service';
import { UserService } from 'src/app/services/user.service';
import Converters from 'src/app/utils/converters';
import { CreateWorkflowModalComponent } from '../create-workflow-modal/create-workflow-modal.component';

@Component({
  selector: 'app-ck-buckets',
  templateUrl: './ck-buckets.component.html',
  styleUrls: ['./ck-buckets.component.scss'],
})
export class CkBucketsComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  boardID: string;
  projectID: string;

  buckets: any[] = [];
  user: AuthUser;
  board: Board | undefined;
  project: Project;
  Role: typeof Role = Role;
  ViewType: typeof ViewType = ViewType;
  BoardScope: typeof BoardScope = BoardScope;

  maxBucketsOnView = 4;
  bucketsOnView: any[] = [];
  viewType = ViewType.BUCKETS;

  constructor(
    public postService: PostService,
    public boardService: BoardService,
    public projectService: ProjectService,
    public bucketService: BucketService,
    public userService: UserService,
    public dialog: MatDialog,
    public commentService: CommentService,
    public upvotesService: UpvotesService,
    private converters: Converters,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  async ngOnInit(): Promise<void> {
    this.user = this.userService.user!;
    await this.configureBoard();
    await this.bucketService.getAllByBoard(this.boardID).then((buckets) => {
      for (const bucket of buckets) {
        if (bucket.addedToView) {
          this.bucketsOnView.push(bucket);
          this.loadBucketPosts(bucket);
        } else {
          this.buckets.push(bucket);
        }
      }
    });
  }

  async configureBoard(): Promise<void> {
    const map = this.activatedRoute.snapshot.paramMap;
    if (map.has('boardID') && map.has('projectID')) {
      this.boardID = this.activatedRoute.snapshot.paramMap.get('boardID') ?? '';
      this.projectID =
        this.activatedRoute.snapshot.paramMap.get('projectID') ?? '';
      const board = await this.boardService.get(this.boardID);
      if (board) {
        this.board = board;
        if (board.viewSettings && !board.viewSettings.allowBuckets) {
          this.router.navigateByUrl(
            `project/${this.projectID}/board/${
              this.boardID
            }/${board.defaultView?.toLowerCase()}`
          );
        }
      } else{
        this.board = undefined;
      }

      this.projectService.get(this.projectID).then((project) => {
        this.project = project;
      });
    }
  }

  async loadBucketPosts(bucket: any) {
    if (!bucket.htmlPosts) {
      bucket.loading = true;
      bucket.htmlPosts = await this.converters.toHTMLPosts(bucket.posts);
      bucket.loading = false;
    }
  }

  copyEmbedCode() {
    const url = window.location.href + '?embedded=true';
    navigator.clipboard.writeText(url);
  }

  copyPersonalEmbedCode() {
    const url =
      window.location.origin +
      `/project/${this.projectID}/my-personal-board?embedded=true`;
    navigator.clipboard.writeText(url);
  }

  addBucketToView(bucket: any, index: number) {
    if (bucket && index >= 0 && index < this.buckets.length) {
      this.buckets.splice(index, 1);
      this.bucketsOnView.push(bucket);
      this.loadBucketPosts(bucket);
      this.bucketService.update(bucket.bucketID, { addedToView: true });
    }
  }

  removeBucketFromView(bucket: any, index: number) {
    if (bucket) {
      this.buckets.push(bucket);
      this.bucketsOnView.splice(index, 1);
      this.bucketService.update(bucket.bucketID, { addedToView: false });
    }
  }

  dragDropPostInBucket(event: CdkDragDrop<any[]>) {
    if (event.previousContainer !== event.container) {
      const post = event.previousContainer.data[event.previousIndex].post;
      if (!post) return;
      if (
        event.container.data.filter((p) => p.post.postID === post.postID)
          .length === 0
      ) {
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex
        );
      } else {
        event.previousContainer.data.splice(event.previousIndex);
      }
      // transfer the html post
      // persist post transfer with db
      const sourceBucketId =
        event.previousContainer.element.nativeElement.dataset.bucket;
      const targetBucketId =
        event.container.element.nativeElement.dataset.bucket;
      if (sourceBucketId) {
        this.bucketService.remove(sourceBucketId, post.postID);
      }
      if (targetBucketId) {
        this.bucketService.add(targetBucketId, post.postID);
      }
    }
  }

  openWorkflowDialog() {
    this._openDialog(CreateWorkflowModalComponent, {
      board: this.board,
      project: this.project,
      onBucketCreation: (bucket: any) => {
        this.bucketsOnView.push(bucket);
        this.loadBucketPosts(bucket);
        this.bucketService.update(bucket.bucketID, { addedToView: true });
      },
    });
  }

  signOut(): void {
    this.userService.logout();
    this.router.navigate(['login']);
  }

  private _openDialog(
    component: ComponentType<unknown>,
    data: any,
    width = '700px'
  ) {
    this.dialog.open(component, {
      maxWidth: 1280,
      width: width,
      autoFocus: false,
      data: data,
    });
  }
}
