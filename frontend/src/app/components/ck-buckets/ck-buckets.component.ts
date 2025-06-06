// ck-buckets.component.ts
import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { ComponentType } from '@angular/cdk/portal';
import { SocketService } from 'src/app/services/socket.service';
import { Subscription } from 'rxjs';
import { SocketEvent } from 'src/app/utils/constants';
import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  HostListener,
  Input,
} from '@angular/core';
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
import { TraceService } from 'src/app/services/trace.service';
import { HtmlPostComponent } from '../html-post/html-post.component';

@Component({
  selector: 'app-ck-buckets',
  templateUrl: './ck-buckets.component.html',
  styleUrls: ['./ck-buckets.component.scss'],
})
export class CkBucketsComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  @Input() isModalView = false;
  @Input() projectID: string;
  @Input() boardID: string;
  @Input() embedded: boolean = false;

  buckets: any[] = [];
  user: AuthUser;
  board: Board | undefined;
  project: Project;
  Role: typeof Role = Role;
  ViewType: typeof ViewType = ViewType;
  BoardScope: typeof BoardScope = BoardScope;
  isTeacher: boolean = false;

  maxBucketsOnView = 4;
  bucketsOnView: any[] = [];
  viewType = ViewType.BUCKETS;

  groupEventToHandler: Map<SocketEvent, Function>;
  unsubListeners: Subscription[] = [];

  dragDisabled: boolean = true;

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
    private socketService: SocketService,
    private activatedRoute: ActivatedRoute,
    private traceService: TraceService
  ) {
    this.groupEventToHandler = new Map<SocketEvent, Function>([]);
  }

  async ngOnInit(): Promise<void> {
    this.user = this.userService.user!;
    this.isTeacher = this.user.role === Role.TEACHER;
    // Prioritize Input properties.  If they are provided, use them.
    if (this.boardID && this.projectID) {
      // We got the IDs from the inputs, proceed as normal.
      await this.configureBoard(); // Load board data
      this.loadBuckets(); // Load buckets
    } else {
      // Fallback to ActivatedRoute *only* if inputs are not provided.
      this.activatedRoute.paramMap.subscribe(async (params) => {
        // Use paramMap (Observable)
        this.boardID = params.get('boardID')!; //use of ! operator
        this.projectID = params.get('projectID')!; //use of ! operator

        if (!this.boardID || !this.projectID) {
          console.error('Missing boardID or projectID in route parameters');
          this.router.navigate(['/error']); // Redirect to an error page, or handle appropriately
          return; // IMPORTANT: Stop execution
        }

        await this.configureBoard(); // Load board data
        this.loadBuckets(); // Load buckets
      });
    }
    this.socketService.connect(this.user.userID, this.boardID);
  }

  initGroupEventsListener() {
    for (const [k, v] of this.groupEventToHandler) {
      const unsub = this.socketService.listen(k, v);
      this.unsubListeners.push(unsub);
    }
  }

  async loadBuckets() {
    if (!this.boardID) return;
    const buckets = await this.bucketService.getAllByBoard(this.boardID);
    if (buckets) {
      for (const bucket of buckets) {
        if (bucket.addedToView) {
          this.bucketsOnView.push(bucket);
          this.loadBucketPosts(bucket);
        } else {
          this.buckets.push(bucket);
        }
      }
    }
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
        if (
          !this.isTeacher &&
          board.viewSettings &&
          !board.viewSettings.allowBuckets
        ) {
          this.router.navigateByUrl(
            `project/${this.projectID}/board/${
              this.boardID
            }/${board.defaultView?.toLowerCase()}`
          );
        }
      } else {
        this.board = undefined;
      }
      if (this.user) {
        this.user.currentView = this.viewType;
        this.userService.updateCurrentView(
          this.user.userID,
          this.user.currentView
        );
      }
      this.projectService.get(this.projectID).then((project) => {
        this.project = project;
      });
      this.traceService.setTraceContext(this.projectID, this.boardID);
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

  async refreshBuckets() {
    //Set all the buckets to loading
    for (let i = 0; i < this.bucketsOnView.length; i++) {
      this.bucketsOnView[i].loading = true;
    }

    // Refetch posts for each displayed bucket.
    for (const bucket of this.bucketsOnView) {
      const currentBucket = await this.bucketService.get(bucket.bucketID); // get bucket from the service
      if (currentBucket) {
        bucket.posts = currentBucket.posts; // update the posts
        bucket.htmlPosts = await this.converters.toHTMLPosts(bucket.posts); // reconvert
      }
      bucket.loading = false;
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

  async ngOnDestroy() {
    this.unsubListeners.forEach((s) => s.unsubscribe());
    this.socketService.disconnect(this.user.userID, this.boardID);
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
