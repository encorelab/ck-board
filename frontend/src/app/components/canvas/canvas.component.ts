import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  HostListener,
  ElementRef,
  Renderer2,
  ChangeDetectorRef,
} from '@angular/core';
import { fabric } from 'fabric';
import { Canvas } from 'fabric/fabric-impl';

import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';

import Post, { PostType } from '../../models/post';

import { BoardService } from '../../services/board.service';
import { PostService } from '../../services/post.service';

import { PostModalComponent } from '../post-modal/post-modal.component';
import { AddPostComponent } from '../add-post-modal/add-post.component';
import { FabricUtils } from 'src/app/utils/FabricUtils';
import {
  Mode,
  POST_DEFAULT_OPACITY,
  POST_MOVING_FILL,
  POST_MOVING_OPACITY,
  SocketEvent,
  STUDENT_POST_COLOR,
} from 'src/app/utils/constants';
import { UserService } from 'src/app/services/user.service';
import {
  Board,
  BoardPermissions,
  BoardScope,
  ViewType,
} from 'src/app/models/board';
import { AuthUser, Role } from 'src/app/models/user';
import { ActivatedRoute, Router } from '@angular/router';
import { CommentService } from 'src/app/services/comment.service';
import { UpvotesService } from 'src/app/services/upvotes.service';
import { CreateWorkflowModalComponent } from '../create-workflow-modal/create-workflow-modal.component';
import { BucketsModalComponent } from '../buckets-modal/buckets-modal.component';
import { ListModalComponent } from '../list-modal/list-modal.component';
// import { FileUploadService } from 'src/app/services/fileUpload.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { TaskModalComponent } from '../task-modal/task-modal.component';
import { Project } from 'src/app/models/project';
import { ProjectService } from 'src/app/services/project.service';
import { SocketService } from 'src/app/services/socket.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { ComponentType } from '@angular/cdk/portal';
import { getErrorMessage } from 'src/app/utils/Utils';
import { Subscription } from 'rxjs';
import { FabricPostComponent } from '../fabric-post/fabric-post.component';
import { TraceService } from 'src/app/services/trace.service';
import Upvote from 'src/app/models/upvote';
import { ManageGroupModalComponent } from '../groups/manage-group-modal/manage-group-modal.component';
import { TodoListModalComponent } from '../todo-list-modal/todo-list-modal.component';
import { ProjectTodoListModalComponent } from '../project-todo-list-modal/project-todo-list-modal.component';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss'],
})
export class CanvasComponent implements OnInit, OnDestroy {
  canvas: Canvas;

  user: AuthUser;
  board: Board;
  project: Project;

  groupEventToHandler: Map<SocketEvent, Function>;

  Math: Math = Math;
  initialClientX = 0;
  initialClientY = 0;
  finalClientX = 0;
  finalClientY = 0;

  numSavedPosts: number = 0;

  zoom = 1;

  ctrlPressed = false;
  rightClickDown = false;

  mode: Mode = Mode.EDIT;
  prevMode: Mode = Mode.EDIT;
  modeType = Mode;
  Role: typeof Role = Role;
  BoardScope: typeof BoardScope = BoardScope;

  showList = false;
  showBuckets = false;

  showAddPost = true;
  lockArrowKeys = false;

  upvoteCounter = 0;

  unsubListeners: Subscription[] = [];

  viewType = ViewType.CANVAS;
  isTeacher: boolean = false;

  @HostListener('wheel', ['$event'])
  onMouseWheel(e: WheelEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  @Input() isModalView = false;
  @Input() projectID: string;
  @Input() boardID: string;
  @Input() embedded: boolean = false;

  private resizeObserver: ResizeObserver;

  constructor(
    public postService: PostService,
    public boardService: BoardService,
    public userService: UserService,
    public commentService: CommentService,
    public upvotesService: UpvotesService,
    public projectService: ProjectService,
    protected fabricUtils: FabricUtils,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public snackbarService: SnackbarService,
    public dialog: MatDialog,
    // public fileUploadService: FileUploadService,
    private socketService: SocketService,
    private canvasService: CanvasService,
    private traceService: TraceService,
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef
  ) {
    this.groupEventToHandler = new Map<SocketEvent, Function>([
      [SocketEvent.POST_CREATE, this.handlePostCreateEvent],
      [SocketEvent.POST_UPDATE, this.handlePostUpdateEvent],
      [SocketEvent.POST_DELETE, this.handlePostDeleteEvent],
      [SocketEvent.POST_START_MOVE, this.handlePostStartMoveEvent],
      [SocketEvent.POST_STOP_MOVE, this.handlePostStopMoveEvent],
      [SocketEvent.POST_UPVOTE_ADD, this.handlePostUpvoteAddEvent],
      [SocketEvent.POST_UPVOTE_REMOVE, this.handlePostUpvoteRemoveEvent],
      [SocketEvent.POST_COMMENT_ADD, this.handlePostCommentAddEvent],
      [SocketEvent.POST_COMMENT_REMOVE, this.handlePostCommentRemoveEvent],
      [SocketEvent.POST_TAG_ADD, this.handlePostTagAddEvent],
      [SocketEvent.POST_TAG_REMOVE, this.handlePostTagRemoveEvent],
      [SocketEvent.BOARD_NAME_UPDATE, this.handleBoardNameUpdateEvent],
      [SocketEvent.BOARD_IMAGE_UPDATE, this.handleBoardImageUpdateEvent],
      [SocketEvent.BOARD_PERMISSIONS_UPDATE, this.handleBoardPermsUpdateEvent],
      [SocketEvent.BOARD_TAGS_UPDATE, this.handleBoardTagsUpdateEvent],
      [SocketEvent.BOARD_TASK_UPDATE, this.handleBoardTaskUpdateEvent],
      [SocketEvent.BOARD_UPVOTE_UPDATE, this.handleBoardUpvoteUpdateEvent],
      [SocketEvent.VOTES_CLEAR, this.handleVotesClearEvent],
      [SocketEvent.BOARD_CLEAR, this.handleBoardClearEvent],
      [SocketEvent.WORKFLOW_RUN_DISTRIBUTION, this.handleWorkflowRun],
      [SocketEvent.WORKFLOW_POST_SUBMIT, this.handleWorkflowPost],
      [SocketEvent.BOARD_CONN_UPDATE, this.handleBoardConnEvent],
    ]);
  }

  ngAfterViewInit(): void {
    if (this.isModalView) {
      this.initResizeObserver();
    }
  }

  async ngOnInit() {
    // Prioritize @Input() properties if provided
    if (this.projectID && this.boardID) {
      this.user = this.userService.user!;
      this.isTeacher = this.user.role === Role.TEACHER;
      this.canvas = new fabric.Canvas(
        'canvas',
        this.embedded
          ? this.fabricUtils.embeddedCanvasConfig
          : this.fabricUtils.canvasConfig
      );
      this.fabricUtils._canvas = this.canvas;
      await this.configureBoard(); // Load board data
      this.socketService.connect(this.user.userID, this.boardID);
      this.initCanvasEventsListener();
      this.initGroupEventsListener();
      window.onbeforeunload = () => this.ngOnDestroy();
    } else {
      // Fallback to ActivatedRoute (for direct routing)
      this.activatedRoute.queryParams.subscribe((params) => {
        if (params.embedded == 'true') {
          this.embedded = true;
        }
      });

      this.user = this.userService.user!;
      this.isTeacher = this.user.role === Role.TEACHER;
      this.canvas = new fabric.Canvas(
        'canvas',
        this.embedded
          ? this.fabricUtils.embeddedCanvasConfig
          : this.fabricUtils.canvasConfig
      );
      this.fabricUtils._canvas = this.canvas;

      this.configureBoard().then(() => {
        //Use then as configure board is now async

        this.socketService.connect(this.user.userID, this.boardID);
        this.initCanvasEventsListener();
        this.initGroupEventsListener();
        this.setTraceViewType();
      });
      window.onbeforeunload = () => this.ngOnDestroy();
    }
  }

  async setTraceViewType() {
    if (this.user) {
      this.user.currentView = this.viewType;
      this.userService.updateCurrentView(
        this.user.userID,
        this.user.currentView
      );
      return true;
    }
    return false;
  }

  initCanvasEventsListener() {
    const unsubCtrl = this.initCtrlKeyListener();
    const unsubMoving = this.initMovingPostListener();
    const unsubExpand = this.initPostClickListener();
    const unsubUpvote = this.initUpvoteClickListener();
    const unsubZoom = this.initZoomListener();
    const unsubPan = this.initPanListener();
    const unsubSwipePan = this.initPanSwipeListener();
    const unsubKeyPan = this.initKeyPanningListener();
    const unsubModal = this.hideListsWhenModalOpen();
    const unsubArrowKeyLock = this.lockArrowKeysWhenModalOpen();
    const unsubArrowKeyUnlock = this.unlockArrowKeysWhenModalClose();

    return [
      unsubCtrl,
      unsubUpvote,
      unsubExpand,
      unsubModal,
      unsubMoving,
      unsubZoom,
      unsubPan,
      unsubSwipePan,
      unsubKeyPan,
      unsubArrowKeyLock,
      unsubArrowKeyUnlock,
    ];
  }

  initGroupEventsListener() {
    for (const [k, v] of this.groupEventToHandler) {
      const unsub = this.socketService.listen(k, v);
      this.unsubListeners.push(unsub);
    }
  }

  handlePostCreateEvent = (post: Post) => {
    if (post.type === PostType.BOARD && post.boardID === this.boardID) {
      const fabricPost = new FabricPostComponent(
        this.user.role,
        this.board.permissions,
        post
      );
      this.canvas.add(fabricPost);
    }
  };

  handlePostUpdateEvent = (post: Post) => {
    let existing = this.fabricUtils.getObjectFromId(post.postID);

    if (existing) {
      existing = this.fabricUtils.updatePostTitleDesc(
        existing,
        post.title,
        post.desc
      );
      this.canvas.requestRenderAll();
    }
  };

  handlePostDeleteEvent = (id: string) => {
    const obj = this.fabricUtils.getObjectFromId(id);
    if (obj) {
      this.canvas.remove(obj);
    }

    this._calcUpvoteCounter();
  };

  handleWorkflowRun = (data: string[] | null) => {
    if (data) {
      data.forEach((postID) => this.handlePostDeleteEvent(postID));
    }
  };

  handleWorkflowPost = (postID: string): void => {
    this.handlePostDeleteEvent(postID);
  };

  handlePostStartMoveEvent = (post: Post) => {
    let obj = this.fabricUtils.getObjectFromId(post.postID);
    obj = this.fabricUtils.setFillColor(obj, POST_MOVING_FILL);
    obj = this.fabricUtils.setOpacity(obj, POST_MOVING_OPACITY);
    obj = this.fabricUtils.setPostMovement(obj, true);
    this.canvas.requestRenderAll();
  };

  handlePostStopMoveEvent = (post: Post) => {
    if (!post.displayAttributes?.position) return;

    let existing = this.fabricUtils.getObjectFromId(post.postID);

    const { left, top } = post.displayAttributes.position;

    this.fabricUtils.animateToPosition(existing, left, top, async () => {
      const fill = await this.fabricUtils.defaultPostColor(post.userID);
      existing = this.fabricUtils.setFillColor(
        existing,
        fill ?? STUDENT_POST_COLOR
      );
      existing = this.fabricUtils.setOpacity(existing, POST_DEFAULT_OPACITY);
      existing = this.fabricUtils.setPostMovement(
        existing,
        !this._postsMovementAllowed()
      );
      existing.setCoords();
      this.canvas.renderAll();
    });
  };

  handlePostUpvoteAddEvent = (result: any) => {
    if (result.upvote.voterID == this.user.userID) this.upvoteCounter -= 1;

    let existing = this.fabricUtils.getObjectFromId(result.upvote.postID);
    if (existing) {
      existing = this.fabricUtils.setUpvoteCount(existing, result.amount);
      this.canvas.requestRenderAll();
    }
  };

  handlePostUpvoteRemoveEvent = (result: any) => {
    if (result.upvote.voterID == this.user.userID) this.upvoteCounter += 1;

    let existing = this.fabricUtils.getObjectFromId(result.upvote.postID);
    if (existing) {
      existing = this.fabricUtils.setUpvoteCount(existing, result.amount);
      this.canvas.requestRenderAll();
    }
  };

  handlePostCommentAddEvent = (result: any) => {
    let existing = this.fabricUtils.getObjectFromId(result.comment.postID);
    if (existing) {
      existing = this.fabricUtils.setCommentCount(existing, result.amount);
      this.canvas.requestRenderAll();
    }
  };

  handlePostCommentRemoveEvent = (result: any) => {
    let existing = this.fabricUtils.getObjectFromId(result.comment.postID);
    if (existing) {
      existing = this.fabricUtils.setCommentCount(existing, result.amount);
      this.canvas.requestRenderAll();
    }
  };

  handlePostTagAddEvent = ({ post, tag }) => {
    const existing = this.fabricUtils.getObjectFromId(post.postID);
    if (existing) {
      this.fabricUtils.applyTagFeatures(existing, tag);
    }
  };

  handlePostTagRemoveEvent = ({ post, tag }) => {
    const existing = this.fabricUtils.getObjectFromId(post.postID);
    if (post.specialAttributes && existing) {
      this.fabricUtils.resetTagFeatures(existing);
    }
  };

  handleBoardNameUpdateEvent = (board: Board) => {
    this.board = board;
  };

  handleBoardImageUpdateEvent = (board: Board) => {
    this.board = board;
    this.fabricUtils.setBackgroundImage(
      board.bgImage?.url,
      board.bgImage?.imgSettings
    );
  };

  handleBoardPermsUpdateEvent = (board: Board) => {
    this.board = board;
    this.updateShowAddPost(board.permissions);
    this.lockPostsMovement(
      !board.permissions.allowStudentMoveAny && this.user.role == Role.STUDENT
    );
    this.setAuthorVisibilityAll();
    this.traceService.setTraceContext(this.projectID, this.boardID);
  };

  handleBoardTagsUpdateEvent = (board: Board) => {
    this.board = board;
  };

  handleBoardTaskUpdateEvent = (board: Board) => {
    this.board = board;
  };

  handleBoardUpvoteUpdateEvent = (board: Board) => {
    this.board = board;
    this._calcUpvoteCounter();
  };

  handleVotesClearEvent = async (result: Upvote[]) => {
    this._calcUpvoteCounter();
    const resetedPosts: string[] = [];
    for (const upvotes of result) {
      if (!resetedPosts.includes(upvotes.postID)) {
        let existing = this.fabricUtils.getObjectFromId(upvotes.postID);
        if (existing) {
          existing = this.fabricUtils.setUpvoteCount(existing, 0);
          this.canvas.requestRenderAll();
          resetedPosts.push(upvotes.postID);
        }
      }
    }
  };

  handleBoardClearEvent = (ids: string[]) => {
    ids.forEach((id) => {
      this.handlePostDeleteEvent(id);
    });
  };

  handleBoardConnEvent = () => {
    if (this.user.role === Role.TEACHER) return;
    this.router.navigate(['/error'], {
      state: {
        code: 403,
        message: 'You do not have access to this board!',
      },
    });
  };

  handlePersonalBoardAddPost = (postData: any) => {
    if (
      postData.post.type === PostType.BOARD &&
      this.board.scope === BoardScope.PROJECT_PERSONAL
    ) {
      const fabricPost = new FabricPostComponent(
        this.user.role,
        this.board.permissions,
        postData.post
      );
      this.canvas.add(fabricPost);
    }
  };
  showBucketsModal() {
    this._openDialog(
      BucketsModalComponent,
      {
        board: this.board,
        user: this.user,
        centerX: this.canvas.getCenter().left,
        centerY: this.canvas.getCenter().top,
      },
      '95vw'
    );
  }

  showListModal() {
    this._openDialog(
      ListModalComponent,
      {
        board: this.board,
        user: this.user,
        centerX: this.canvas.getCenter().left,
        centerY: this.canvas.getCenter().top,
      },
      '95vw'
    );
  }

  intermediateBoardConfig(board: Board) {
    this.board = board;
    this._calcUpvoteCounter();
    this.configureZoom();
    this.fabricUtils.setBackgroundImage(
      board.bgImage?.url,
      board.bgImage?.imgSettings
    );
    this.lockPostsMovement(
      !board.permissions.allowStudentMoveAny && this.user.role == Role.STUDENT
    );
    this.updateShowAddPost(this.board.permissions);
    this.setAuthorVisibilityAll();
    if (this.board.permissions.showSnackBarStudent) {
      this.openTaskDialog();
    }
  }

  async configureBoard() {
    const map = this.activatedRoute.snapshot.paramMap;

    if (this.projectID && this.boardID) {
      //use inputs if available
      try {
        const tempBoard = await this.boardService.get(this.boardID); // Await here
        if (!tempBoard) {
          // Handle the case where the board is not found.
          console.error('Board not found:', this.boardID);
          this.snackbarService.queueSnackbar('Board not found.');
          this.router.navigate(['/error']); // Redirect, or show error
          return; // IMPORTANT: Stop execution
        }
        this.board = tempBoard;
        this.project = await this.projectService.get(this.projectID); //load project
        if (!this.project) {
          console.error('Project not found:', this.projectID);
          this.snackbarService.queueSnackbar('Project not found.');
          this.router.navigate(['/error']); // Redirect, or show error
          return; // IMPORTANT: Stop execution
        }

        this.intermediateBoardConfig(this.board);
        this.traceService.setTraceContext(this.projectID, this.boardID);

        this.postService.getAllByBoard(this.boardID).then((data) => {
          //get all posts
          data.forEach(async (post) => {
            if (post.type == PostType.BOARD) {
              const upvotes = await this.upvotesService.getUpvotesByPost(
                post.postID
              );
              const comments = await this.commentService.getCommentsByPost(
                post.postID
              );

              this.canvas.add(
                new FabricPostComponent(
                  this.user.role,
                  this.board.permissions,
                  post,
                  {
                    upvotes: upvotes.length,
                    comments: comments.length,
                  }
                )
              );
            }
          });
        });
      } catch (error: any) {
        console.error('Error in configure board', error);
        this.snackbarService.queueSnackbar('Error in configure board');
        this.router.navigate(['/error']);
        return;
      }
    } else if (map.has('boardID') && map.has('projectID')) {
      //get from routed params
      this.boardID = this.activatedRoute.snapshot.paramMap.get('boardID') ?? '';
      this.projectID =
        this.activatedRoute.snapshot.paramMap.get('projectID') ?? '';
      this.traceService.setTraceContext(this.projectID, this.boardID);

      try {
        const tempBoard = await this.boardService.get(this.boardID); // Await here
        if (!tempBoard) {
          console.error('Board not found for ID:', this.boardID);
          this.snackbarService.queueSnackbar('Board not found.');
          this.router.navigate(['/error']);
          return;
        }
        this.board = tempBoard;

        this.project = await this.projectService.get(this.projectID); // Await here
        if (!this.project) {
          console.error('Project not found for ID:', this.projectID);
          this.snackbarService.queueSnackbar('Project not found.');
          this.router.navigate(['/error']);
          return;
        }

        this.intermediateBoardConfig(this.board);
        this.postService.getAllByBoard(this.boardID).then((data) => {
          data.forEach(async (post) => {
            if (post.type == PostType.BOARD) {
              const upvotes = await this.upvotesService.getUpvotesByPost(
                post.postID
              );
              const comments = await this.commentService.getCommentsByPost(
                post.postID
              );
              this.canvas.add(
                new FabricPostComponent(
                  this.user.role,
                  this.board.permissions,
                  post,
                  {
                    //CRITICAL: Role and permissions!
                    upvotes: upvotes.length,
                    comments: comments.length,
                  }
                )
              );
            }
          });
          if (
            !this.isTeacher &&
            this.board &&
            !this.board.viewSettings?.allowCanvas
          ) {
            this.router.navigateByUrl(
              `project/${this.projectID}/board/${
                this.boardID
              }/${this.board.defaultView?.toLowerCase()}`
            );
          }
        });
      } catch (error: any) {
        console.error('Error configuring board (routed):', error);
        this.snackbarService.queueSnackbar('Error configuring board.');
        this.router.navigate(['/error']); // Or handle differently
        return;
      }
    } else if (map.has('projectID')) {
      //personal board
      this.projectID =
        this.activatedRoute.snapshot.paramMap.get('projectID') ?? '';
      try {
        const personalBoard = await this.boardService.getPersonal(
          this.projectID
        );
        if (personalBoard) {
          this.boardID = personalBoard.boardID;
          this.traceService.setTraceContext(this.projectID, this.boardID);
        } else {
          console.error(
            'Personal board not found for projectID:',
            this.projectID
          );
          this.snackbarService.queueSnackbar('Personal board not found');
          this.router.navigate(['/error']);
          return;
        }
        this.project = await this.projectService.get(this.projectID); // Await here
        if (!this.project) {
          console.error('Project not found for ID:', this.projectID);
          this.snackbarService.queueSnackbar('Project not found.');
          this.router.navigate(['/error']);
          return;
        }

        this.postService.getAllByBoard(this.boardID).then((data) => {
          //get all posts
          data.forEach(async (post) => {
            if (post.type == PostType.BOARD) {
              const upvotes = await this.upvotesService.getUpvotesByPost(
                post.postID
              );
              const comments = await this.commentService.getCommentsByPost(
                post.postID
              );
              this.canvas.add(
                new FabricPostComponent(
                  this.user.role,
                  this.board.permissions,
                  post,
                  {
                    //CRITICAL: Role and permissions!
                    upvotes: upvotes.length,
                    comments: comments.length,
                  }
                )
              );
            }
          });
          if (personalBoard) this.intermediateBoardConfig(personalBoard);
        });
      } catch (error: any) {
        console.error('Error in configure board, personal board', error);
        this.snackbarService.queueSnackbar('Error in configure board');
        this.router.navigate(['/error']);
        return;
      }
    } else {
      //no project id or board id
      console.error(
        'Missing required route parameters (projectID and/or boardID)'
      );
      this.snackbarService.queueSnackbar('Error in configure board');
      this.router.navigate(['error']); // Or handle differently
      return; // IMPORTANT
    }
  }

  // TODO: handle board update from toolbar-menu
  configureZoom() {
    if (this.board.initialZoom) {
      const zoom = this.board.initialZoom / 100;
      this.zoom = parseFloat(zoom.toPrecision(2));
      this.handleZoom('setZoom');
    } else {
      this.zoom = 1;
    }
  }

  // open dialog to get message for a new post
  handleCreatePost() {
    this.mode = Mode.CHOOSING_LOCATION;
    this.canvas.defaultCursor = 'copy';
    this.canvas.hoverCursor = 'not-allowed';
    this.snackbarService.queueSnackbar(
      'Click where you want the post to be created!'
    );
    this.canvas.on('mouse:down', this.handleChoosePostLocation);
  }

  handleChoosePostLocation = (opt) => {
    if (opt.target == null) {
      this.canvas.selection = false;
      this._openDialog(AddPostComponent, {
        type: PostType.BOARD,
        board: this.board,
        user: this.user,
        spawnPosition: {
          top: opt.absolutePointer ? opt.absolutePointer.y : 150,
          left: opt.absolutePointer ? opt.absolutePointer.x : 150,
        },
      });
    }
    this.snackbarService.dequeueSnackbar();
    this.canvas.off('mouse:down', this.handleChoosePostLocation);
    this.enableEditMode();
  };

  disableChooseLocation() {
    this.snackbarService.dequeueSnackbar();
    this.canvas.off('mouse:down', this.handleChoosePostLocation);
    this.enableEditMode();
  }

  lockPostsMovement(value) {
    this.canvas.getObjects().map((obj) => {
      obj.set({ lockMovementX: value, lockMovementY: value });
    });
    this.canvas.renderAll();
  }

  onResize(event?: any) {
    if (!this.isModalView || !this.canvas) {
      return;
    }
    const canvasElement = document.getElementById('canvas');
    if (canvasElement) {
      const modalContent = canvasElement.closest('.mat-dialog-content');
      if (modalContent) {
        this.resizeCanvas(modalContent.clientWidth, modalContent.clientHeight);
      }
    }
  }

  resizeCanvas(width: number, height: number) {
    if (!this.canvas) {
      console.warn('Canvas not initialized yet!');
      return;
    }

    this.canvas.setWidth(width - 40);
    this.canvas.setHeight(height);
    this.canvas.calcOffset();
    this.canvas.renderAll();
  }

  initResizeObserver() {
    const canvasElement = document.getElementById('canvas');
    if (canvasElement) {
      const modalContent = canvasElement.closest('.mat-dialog-content');
      if (modalContent) {
        this.resizeObserver = new ResizeObserver(() => {
          this.onResize();
        });
        this.resizeObserver.observe(modalContent);
      }
    }
  }

  hideAuthorNames() {
    this.canvas.getObjects().map((obj) => {
      this.fabricUtils.updateAuthor(obj, 'Anonymous');
    });
    this.canvas.renderAll();
  }

  updateAuthorNames(postID: string, username: string) {
    const obj = this.fabricUtils.getObjectFromId(postID);
    if (obj) {
      this.fabricUtils.updateAuthor(obj, username);
      this.canvas.renderAll();
    }
  }

  setAuthorVisibilityOne(post) {
    if (!this.board) {
      return;
    }
    const isStudentAndVisible =
      this.user.role == Role.STUDENT &&
      this.board.permissions.showAuthorNameStudent;
    const IsTeacherAndVisisble =
      this.user.role == Role.TEACHER &&
      this.board.permissions.showAuthorNameTeacher;
    if (!(isStudentAndVisible || IsTeacherAndVisisble)) {
      this.updateAuthorNames(post.postID, 'Anonymous');
    } else {
      this.userService.getOneById(post.userID).then((user: any) => {
        this.updateAuthorNames(post.postID, user.username);
      });
    }
  }

  setAuthorVisibilityAll() {
    this.postService.getAllByBoard(this.boardID).then((data) => {
      // update all the post names to to the poster's name rather than anonymous
      data.forEach((post) => {
        this.setAuthorVisibilityOne(post);
      });
    });
  }

  updateShowAddPost(permissions: BoardPermissions) {
    const isStudent = this.user.role == Role.STUDENT;
    const isTeacher = this.user.role == Role.TEACHER;
    this.showAddPost =
      (isStudent && permissions.allowStudentEditAddDeletePost) || isTeacher;
  }

  openTaskDialog() {
    if (!this.board.task) return;

    const title = this.board.task.title
      ? this.board.task.title
      : 'No task created!';
    const message = this.board.task.message;

    if (this.snackbarService.snackbarIsOpen()) {
      this.snackbarService.dequeueSnackbar();
      return;
    }

    const openDialogCloseSnack = () => {
      this._openDialog(TaskModalComponent, {
        title: title,
        message: message,
      });
      this.snackbarService.dequeueSnackbar();
    };

    this.snackbarService.queueSnackbar(title, message, {
      action: { name: 'View Full Task', run: openDialogCloseSnack },
      matSnackbarConfig: {
        verticalPosition: 'bottom',
        horizontalPosition: 'center',
        panelClass: ['wide-snackbar'],
      },
    });
  }

  initUpvoteClickListener() {
    this.canvas.on('mouse:down', this.handleUpvoteClick);
    this.canvas.on('mouse:down', this.handleDownvoteClick);

    return () => {
      this.canvas.off('mouse:down', this.handleUpvoteClick);
      this.canvas.off('mouse:down', this.handleDownvoteClick);
    };
  }

  handleUpvoteClick = async (e: fabric.IEvent) => {
    const post: any = e.target;
    const upvoteButton = e.subTargets?.find((o) => o.name == 'upvote');

    if (upvoteButton && this._votingAllowed()) {
      this.canvasService
        .upvote(this.user.userID, post.postID)
        .catch((e) => this.snackbarService.queueSnackbar(getErrorMessage(e)));
    }
  };

  handleDownvoteClick = async (e: fabric.IEvent) => {
    const post: any = e.target;
    const upvoteButton = e.subTargets?.find((o) => o.name == 'downvote');

    if (upvoteButton && this._votingAllowed()) {
      this.canvasService
        .unupvote(this.user.userID, post.postID)
        .catch((e) => this.snackbarService.queueSnackbar(getErrorMessage(e)));
    }
  };

  initCtrlKeyListener() {
    document.addEventListener('keydown', (event) => {
      /* Switch to pan mode on Ctrl press, only if not already holding right-click down */
      if (!this.rightClickDown && event.key === 'Control') {
        this.ctrlPressed = true;
        this.prevMode = this.mode;
        this.enablePanMode();
      }
    });

    document.addEventListener('keyup', (event) => {
      if (event.key === 'Control') {
        this.ctrlPressed = false;
        if (this.prevMode === Mode.EDIT) {
          this.enableEditMode();
        }
      }
    });

    return () => {
      if (document.removeAllListeners) {
        document.removeAllListeners('keydown');
        document.removeAllListeners('keyup');
      }
    };
  }

  initPostClickListener() {
    let isDragging = false;
    let isMouseDown = false;

    const postClickHandler = (e: fabric.IEvent) => {
      if (e.target?.name == 'post') isMouseDown = true;
    };

    const postMovingHandler = (e: fabric.IEvent) => {
      if (e.target?.name == 'post') isDragging = isMouseDown;
    };

    const mouseUpHandler = (e: fabric.IEvent) => {
      const obj: any = e.target;

      const votePress = e.subTargets?.find(
        (o) => o.name == 'upvote' || o.name == 'downvote'
      );
      const commentPress = e.subTargets?.find((o) => o.name == 'comment');
      const isDragEnd = isDragging;
      isDragging = false;
      isMouseDown = false;

      if (!isDragEnd && !votePress && obj?.name == 'post') {
        this.canvas.discardActiveObject().renderAll();

        this._openDialog(PostModalComponent, {
          user: this.user,
          post: obj,
          board: this.board,
          commentPress: commentPress,
          numSavedPosts: this.numSavedPosts,
          updateNumSavedPosts: (num) => {
            this.numSavedPosts = num;
          },
        });
        this.canvasService.readPost(obj.postID);
      }
    };

    this.canvas.on('mouse:down', postClickHandler);
    this.canvas.on('mouse:move', postMovingHandler);
    this.canvas.on('mouse:up', mouseUpHandler);

    return () => {
      this.canvas.off('mouse:down', postClickHandler);
      this.canvas.off('mouse:move', postMovingHandler);
      this.canvas.off('mouse:up', mouseUpHandler);
    };
  }

  initMovingPostListener() {
    let isMovingPost = false;

    const handleFirstMove = (e: any) => {
      if (e.target && !isMovingPost) {
        let obj = e.target;
        isMovingPost = true;

        obj = this.fabricUtils.setFillColor(obj, POST_MOVING_FILL);
        obj = this.fabricUtils.setOpacity(obj, POST_MOVING_OPACITY);
        this.canvas.renderAll();

        this.socketService.emit(SocketEvent.POST_START_MOVE, {
          postID: obj.postID,
        });
      }
    };

    const handleDroppedPost = async (e) => {
      if (!isMovingPost) return;

      let obj = e.target;
      isMovingPost = false;

      const fill = await this.fabricUtils.defaultPostColor(obj.userID);
      obj = this.fabricUtils.setFillColor(obj, fill ?? STUDENT_POST_COLOR);
      obj = this.fabricUtils.setOpacity(obj, POST_DEFAULT_OPACITY);
      this.canvas.renderAll();

      this.socketService.emit(SocketEvent.POST_STOP_MOVE, {
        postID: obj.postID,
        left: obj.left,
        top: obj.top,
      });
    };

    this.canvas.on('object:moving', handleFirstMove);
    this.canvas.on('mouse:up', handleDroppedPost);

    return () => {
      this.canvas.off('object:moving', handleFirstMove);
      this.canvas.off('mouse:up', handleDroppedPost);
    };
  }

  initZoomListener() {
    const handleZoomEvent = (opt) => {
      const options = opt.e as unknown as WheelEvent;

      // Condition for pinch gesture on trackpad:
      // 1. delta Y is an integer or delta X is 0
      // 2. ctrl key is triggered
      const trackpad_pinch =
        (Number.isInteger(options.deltaY) || Math.abs(options.deltaX) < 1e-9) &&
        options.ctrlKey;

      // Condition for mousewheel:
      // 1. delta Y has trailing non-zero decimal points
      // 2. delta X is zero
      // 3. ctrl key is not triggered
      const mousewheel =
        !(Math.abs(options.deltaY - Math.floor(options.deltaY)) < 1e-9) &&
        Math.abs(options.deltaX) < 1e-9 &&
        !options.ctrlKey;

      if (trackpad_pinch || mousewheel) {
        const delta = options.deltaY;

        if (mousewheel) {
          this.zoom *= 0.999 ** delta;
        } else {
          this.zoom *= 0.99 ** delta;
        }
        if (this.zoom > 20) this.zoom = 20;
        if (this.zoom < 0.01) this.zoom = 0.01;

        this.canvas.zoomToPoint(
          new fabric.Point(options.offsetX, options.offsetY),
          this.zoom
        );
        opt.e.preventDefault();
        opt.e.stopPropagation();
      }
    };

    this.canvas.on('mouse:wheel', handleZoomEvent);

    return () => {
      this.canvas.off('mouse:wheel', handleZoomEvent);
    };
  }

  initPanListener() {
    let isPanning = false;

    const mouseDown = (opt) => {
      const { e: options } = opt;

      /* Switch to pan mode on right-click, only if ctrl is not already pressed */
      if (!this.ctrlPressed && (options.button === 2 || options.which === 3)) {
        this.prevMode = this.mode;
        this.enablePanMode();
        this.rightClickDown = true;
      }

      if (this.mode == Mode.PAN) {
        isPanning = true;
        this.canvas.selection = false;
        const options = opt.e as unknown as WheelEvent;
        this.initialClientX = options.clientX;
        this.initialClientY = options.clientY;
      }
    };

    const mouseUp = (opt) => {
      if (this.rightClickDown) {
        this.rightClickDown = false;
        if (this.prevMode === Mode.EDIT) {
          this.enableEditMode();
        }
      }
      isPanning = false;
      this.canvas.selection = true;
      const options = opt.e as unknown as WheelEvent;
      this.initialClientX = options.clientX;
      this.initialClientY = options.clientY;
    };

    const handlePan = (opt) => {
      const options = opt.e as unknown as WheelEvent;
      if (isPanning && options) {
        const delta = new fabric.Point(options.movementX, options.movementY);
        this.canvas.relativePan(delta);
        this.finalClientX = options.clientX;
        this.finalClientY = options.clientY;
      }
    };

    this.canvas.on('mouse:down', mouseDown);
    this.canvas.on('mouse:up', mouseUp);
    this.canvas.on('mouse:move', handlePan);

    return () => {
      this.canvas.off('mouse:down', mouseDown);
      this.canvas.off('mouse:up', mouseUp);
      this.canvas.off('mouse:move', handlePan);
    };
  }

  initPanSwipeListener() {
    const handlePanSwipe = (opt) => {
      const options = opt.e as unknown as WheelEvent;

      // Condition for two-finger swipe on trackpad:
      // 1. delta Y is an integer,
      // 2. delta X is an integer,
      // 3. ctrl key is not triggered
      const trackpad_twofinger =
        Number.isInteger(options.deltaY) &&
        Number.isInteger(options.deltaX) &&
        !options.ctrlKey;

      if (trackpad_twofinger) {
        const vpt = this.canvas.viewportTransform;
        if (!vpt) return;
        vpt[4] -= options.deltaX;
        vpt[5] -= options.deltaY;
        this.canvas.setViewportTransform(vpt);
        this.canvas.requestRenderAll();
      }
    };

    this.canvas.on('mouse:wheel', handlePanSwipe);

    return () => {
      this.canvas.off('mouse:wheel', handlePanSwipe);
    };
  }

  initKeyPanningListener() {
    document.addEventListener('keydown', (event) => {
      if (!this.lockArrowKeys) {
        if (event.key == 'ArrowUp') {
          event.preventDefault();
          this.canvas.relativePan(
            new fabric.Point(0, 30 * this.canvas.getZoom())
          );
        } else if (event.key == 'ArrowDown') {
          event.preventDefault();
          this.canvas.relativePan(
            new fabric.Point(0, -30 * this.canvas.getZoom())
          );
        } else if (event.key == 'ArrowLeft') {
          event.preventDefault();
          this.canvas.relativePan(
            new fabric.Point(30 * this.canvas.getZoom(), 0)
          );
        } else if (event.key == 'ArrowRight') {
          event.preventDefault();
          this.canvas.relativePan(
            new fabric.Point(-30 * this.canvas.getZoom(), 0)
          );
        }
      }
    });

    return () => {
      if (document.removeAllListeners) document.removeAllListeners('keydown');
    };
  }

  enablePanMode() {
    this.mode = Mode.PAN;
    this.lockPostsMovement(true);
    this.canvas.defaultCursor = 'grab';
    this.canvas.hoverCursor = 'grab';
  }

  enableEditMode() {
    this.mode = Mode.EDIT;
    this.lockPostsMovement(false);
    this.canvas.defaultCursor = 'default';
    this.canvas.hoverCursor = 'move';
  }

  handleZoom(event) {
    const center = this.canvas.getCenter();
    let centerX = center.left + (this.finalClientX - this.initialClientX);
    let centerY = center.top + (this.finalClientY - this.initialClientY);
    this.initialClientX = this.finalClientX;
    this.initialClientY = this.finalClientY;

    if (event === 'zoomIn') {
      this.zoom += 0.05;
    } else if (event === 'zoomOut') {
      this.zoom -= 0.05;
    } else if (event === 'reset') {
      this.zoom = 1;
    } else if (event === 'setZoom') {
      // this.zoom = this.zoom;
      centerX = center.left;
      centerY = center.top;
    }

    if (this.zoom > 20) {
      this.zoom = 20;
    } else if (this.zoom < 0.01) {
      this.zoom = 0.01;
    }

    this.canvas.zoomToPoint(new fabric.Point(centerX, centerY), this.zoom);
  }

  hideListsWhenModalOpen() {
    const subscription = this.dialog.afterOpened.subscribe(() => {
      this.showList = false;
      this.showBuckets = false;
    });

    return () => {
      subscription.unsubscribe();
    };
  }

  lockArrowKeysWhenModalOpen() {
    const subscription = this.dialog.afterOpened.subscribe(() => {
      this.lockArrowKeys = true;
    });
    return () => {
      subscription.unsubscribe();
    };
  }

  unlockArrowKeysWhenModalClose() {
    const subscription = this.dialog.afterAllClosed.subscribe(() => {
      this.lockArrowKeys = false;
    });
    return () => {
      subscription.unsubscribe();
    };
  }

  openTodoList() {
    this.router.navigate([`/project/${this.projectID}/todo`]);
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

  private _calcUpvoteCounter() {
    if (this.board && this.board.upvoteLimit) {
      this.upvotesService
        .getByBoardAndUser(this.boardID, this.user.userID)
        .then((votes) => {
          this.upvoteCounter = this.board.upvoteLimit - votes.length;
        });
    }
  }

  private _postsMovementAllowed() {
    if (!this.user || !this.board) return false;

    const isTeacher = this.user.role == Role.TEACHER;
    const isStudent = this.user.role == Role.STUDENT;
    const allowStudentMovement = this.board.permissions.allowStudentMoveAny;

    return isTeacher || (isStudent && allowStudentMovement);
  }

  private _votingAllowed() {
    const isStudent = this.user.role == Role.STUDENT;
    const isTeacher = this.user.role == Role.TEACHER;
    const allowStudent =
      isStudent && this.board.permissions.allowStudentUpvoting;

    return allowStudent || isTeacher;
  }

  async ngOnDestroy() {
    this.unsubListeners.forEach((s) => s.unsubscribe());
    this.socketService.disconnect(this.user.userID, this.boardID);
    this.snackbarService.ngOnDestroy();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}
