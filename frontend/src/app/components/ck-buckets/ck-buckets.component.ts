import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import { Board, BoardScope, ViewType } from 'src/app/models/board';
import { PostType } from 'src/app/models/post';
import { Project } from 'src/app/models/project';
import { AuthUser, Role } from 'src/app/models/user';
import { BoardService } from 'src/app/services/board.service';
import { BucketService } from 'src/app/services/bucket.service';
import { CommentService } from 'src/app/services/comment.service';
import { PostService } from 'src/app/services/post.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { UpvotesService } from 'src/app/services/upvotes.service';
import { UserService } from 'src/app/services/user.service';
import Converters from 'src/app/utils/converters';
import { HTMLPost } from '../html-post/html-post.component';
import { CreateWorkflowModalComponent } from '../create-workflow-modal/create-workflow-modal.component';
import { ComponentType } from '@angular/cdk/portal';
import { MatDialog } from '@angular/material/dialog';

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
  board: Board;
  project: Project;
  Role: typeof Role = Role;
  ViewType: typeof ViewType = ViewType;
  BoardScope: typeof BoardScope = BoardScope;

  posts: HTMLPost[];

  length = 0;
  pageSize = 8;
  pageSizeOptions: number[] = [4, 8, 12, 16];
  pageEvent: PageEvent;

  maxBucketsOnView = 4;
  bucketsOnView: any[] = [];
  loading = true;

  constructor(
    public postService: PostService,
    public boardService: BoardService,
    public bucketService: BucketService,
    public userService: UserService,
    public dialog: MatDialog,
    public commentService: CommentService,
    public upvotesService: UpvotesService,
    public snackbarService: SnackbarService,
    private converters: Converters,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  async ngOnInit(): Promise<void> {
    this.user = this.userService.user!;
    await this.configureBoard();
    this.fetchBuckets();
  }

  async ngOnDestroy() {
    this.snackbarService.ngOnDestroy();
    // this.activeBucket = null;
    this.buckets = [];
    this.posts = [];
  }

  async configureBoard(): Promise<void> {
    const map = this.activatedRoute.snapshot.paramMap;
    if (map.has('boardID') && map.has('projectID')) {
      this.boardID = this.activatedRoute.snapshot.paramMap.get('boardID') ?? '';
      this.projectID =
        this.activatedRoute.snapshot.paramMap.get('projectID') ?? '';
      this.postService.getAllByBoard(this.boardID).then((data) => {
        data.forEach(async (post) => {
          if (post.type == PostType.BOARD) {
            const upvotes = await this.upvotesService.getUpvotesByPost(
              post.postID
            );
            const comments = await this.commentService.getCommentsByPost(
              post.postID
            );
          }
        });
        this.boardService.get(this.boardID).then((board) => {
          if (board) this.board = board;
        });
      });
    }
  }

  fetchBuckets(): void {
    this.bucketService.getAllByBoard(this.boardID).then((buckets) => {
      this.buckets = buckets;
      if (this.buckets.length > 0) {
        this.loadBucket(this.buckets[0]);
      } else {
        this.loading = false;
      }
    });
  }

  loadBucket(bucket: any, event?: any): void {
    // this.activeBucket = bucket;
    // this.activeBucketName = bucket.name;
    // this.paginator.pageIndex = 0;
    // this.loadBucketPosts(bucket);
  }

  loadBucketPosts(bucket: any, event?: any): PageEvent {
    this.posts = [];
    this.loading = true;

    const size = event ? event.pageSize : this.pageSize;
    const page = event ? event.pageIndex : 0;
    this.postService
      .getAllByBucket(bucket.bucketID, { page, size })
      .then(async ({ posts, count }) => {
        this.length = count;
        this.posts = await this.converters.toHTMLPosts(posts);
        this.loading = false;
      });

    return event;
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
    }
  }

  removeBucketFromView(bucket: any, index: number) {
    if (bucket) {
      this.buckets.push(bucket);
      this.bucketsOnView.splice(index, 1);
    }
  }

  openWorkflowDialog() {
    this._openDialog(CreateWorkflowModalComponent, {
      board: this.board,
      project: this.project,
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
