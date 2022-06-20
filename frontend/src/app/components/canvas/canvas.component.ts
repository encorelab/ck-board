import { Component, OnDestroy, OnInit } from '@angular/core';
import { fabric } from 'fabric';
import { Canvas } from 'fabric/fabric-impl';

import { MatDialog } from '@angular/material/dialog';

import Post, { PostType } from '../../models/post';

import { BoardService } from '../../services/board.service';
import { PostService } from '../../services/post.service';

import { PostModalComponent } from '../post-modal/post-modal.component';
import { ConfigurationModalComponent } from '../configuration-modal/configuration-modal.component';
import { AddPostComponent } from '../add-post-modal/add-post.component';
import { FabricUtils } from 'src/app/utils/FabricUtils';
import {
  Mode,
  POST_DEFAULT_OPACITY,
  POST_MOVING_FILL,
  POST_MOVING_OPACITY,
  SocketEvent,
} from 'src/app/utils/constants';
import { UserService } from 'src/app/services/user.service';
import { Board, BoardPermissions } from 'src/app/models/board';
import { AuthUser, Role } from 'src/app/models/user';
import { ActivatedRoute, Router } from '@angular/router';
import { CommentService } from 'src/app/services/comment.service';
import { LikesService } from 'src/app/services/likes.service';
import Like from 'src/app/models/like';
import { CreateWorkflowModalComponent } from '../create-workflow-modal/create-workflow-modal.component';
import { BucketsModalComponent } from '../buckets-modal/buckets-modal.component';
import { ListModalComponent } from '../list-modal/list-modal.component';
import { POST_COLOR } from 'src/app/utils/constants';
import { FileUploadService } from 'src/app/services/fileUpload.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { TaskModalComponent } from '../task-modal/task-modal.component';
import { Project } from 'src/app/models/project';
import { ProjectService } from 'src/app/services/project.service';
import { SocketService } from 'src/app/services/socket.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { ComponentType } from '@angular/cdk/portal';
import Utils from 'src/app/utils/Utils';
import { Subscription } from 'rxjs';
import { FabricPostComponent } from '../fabric-post/fabric-post.component';
import { TraceService } from 'src/app/services/trace.service';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss'],
})
export class CanvasComponent implements OnInit, OnDestroy {
  boardID: string;
  projectID: string;
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

  zoom = 1;

  mode: Mode = Mode.EDIT;
  modeType = Mode;
  Role: typeof Role = Role;

  showList = false;
  showBuckets = false;

  showAddPost = true;
  lockArrowKeys = false;

  unsubListeners: Subscription[] = [];

  constructor(
    public postService: PostService,
    public boardService: BoardService,
    public userService: UserService,
    public commentService: CommentService,
    public likesService: LikesService,
    public projectService: ProjectService,
    protected fabricUtils: FabricUtils,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public snackbarService: SnackbarService,
    public dialog: MatDialog,
    public fileUploadService: FileUploadService,
    private socketService: SocketService,
    private canvasService: CanvasService,
    private traceService: TraceService
  ) {
    this.groupEventToHandler = new Map<SocketEvent, Function>([
      [SocketEvent.POST_CREATE, this.handlePostCreateEvent],
      [SocketEvent.POST_UPDATE, this.handlePostUpdateEvent],
      [SocketEvent.POST_DELETE, this.handlePostDeleteEvent],
      [SocketEvent.POST_START_MOVE, this.handlePostStartMoveEvent],
      [SocketEvent.POST_STOP_MOVE, this.handlePostStopMoveEvent],
      [SocketEvent.POST_LIKE_ADD, this.handlePostLikeAddEvent],
      [SocketEvent.POST_LIKE_REMOVE, this.handlePostLikeRemoveEvent],
      [SocketEvent.POST_COMMENT_ADD, this.handlePostCommentAddEvent],
      [SocketEvent.POST_TAG_ADD, this.handlePostTagAddEvent],
      [SocketEvent.POST_TAG_REMOVE, this.handlePostTagRemoveEvent],
      [SocketEvent.BOARD_NAME_UPDATE, this.handleBoardNameUpdateEvent],
      [SocketEvent.BOARD_IMAGE_UPDATE, this.handleBoardImageUpdateEvent],
      [SocketEvent.BOARD_PERMISSIONS_UPDATE, this.handleBoardPermsUpdateEvent],
      [SocketEvent.BOARD_TAGS_UPDATE, this.handleBoardTagsUpdateEvent],
      [SocketEvent.BOARD_TASK_UPDATE, this.handleBoardTaskUpdateEvent],
    ]);
  }

  ngOnInit() {
    this.user = this.userService.user!;
    this.canvas = new fabric.Canvas('canvas', this.fabricUtils.canvasConfig);
    this.fabricUtils._canvas = this.canvas;

    this.configureBoard();

    this.socketService.connect(this.user.userID, this.boardID);

    this.initCanvasEventsListener();
    this.initGroupEventsListener();

    window.onbeforeunload = () => this.ngOnDestroy();
  }

  initCanvasEventsListener() {
    const unsubMoving = this.initMovingPostListener();
    const unsubExpand = this.initPostClickListener();
    const unsubLike = this.initLikeClickListener();
    const unsubZoom = this.initZoomListener();
    const unsubPan = this.initPanListener();
    const unsubSwipePan = this.initPanSwipeListener();
    const unsubKeyPan = this.initKeyPanningListener();
    const unsubModal = this.hideListsWhenModalOpen();
    const unsubArrowKeyLock = this.lockArrowKeysWhenModalOpen();
    const unsubArrowKeyUnlock = this.unlockArrowKeysWhenModalClose();

    return [
      unsubLike,
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
    const fabricPost = new FabricPostComponent(post);
    this.canvas.add(fabricPost);
  };

  handlePostUpdateEvent = (post: Post) => {
    let existing = this.fabricUtils.getObjectFromId(post.postID);
    existing = this.fabricUtils.updatePostTitleDesc(
      existing,
      post.title,
      post.desc
    );
    this.canvas.requestRenderAll();
  };

  handlePostDeleteEvent = (id: string) => {
    const obj = this.fabricUtils.getObjectFromId(id);
    this.canvas.remove(obj);
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

    this.fabricUtils.animateToPosition(existing, left, top, () => {
      existing = this.fabricUtils.setFillColor(existing, POST_COLOR);
      existing = this.fabricUtils.setOpacity(existing, POST_DEFAULT_OPACITY);
      existing = this.fabricUtils.setPostMovement(
        existing,
        !this._postsMovementAllowed()
      );
      existing.setCoords();
      this.canvas.renderAll();
    });
  };

  handlePostLikeAddEvent = (result: any) => {
    let existing = this.fabricUtils.getObjectFromId(result.like.postID);
    existing = this.fabricUtils.setLikeCount(existing, result.amount);
    this.canvas.requestRenderAll();
  };

  handlePostLikeRemoveEvent = (result: any) => {
    let existing = this.fabricUtils.getObjectFromId(result.like.postID);
    existing = this.fabricUtils.setLikeCount(existing, result.amount);
    this.canvas.requestRenderAll();
  };

  handlePostCommentAddEvent = (result: any) => {
    let existing = this.fabricUtils.getObjectFromId(result.comment.postID);
    existing = this.fabricUtils.setCommentCount(existing, result.amount);
    this.canvas.requestRenderAll();
  };

  handlePostTagAddEvent = ({ post, tag }) => {
    const existing = this.fabricUtils.getObjectFromId(post.postID);
    this.fabricUtils.applyTagFeatures(existing, tag);
  };

  handlePostTagRemoveEvent = ({ post, tag }) => {
    if (post.specialAttributes) {
      const existing = this.fabricUtils.getObjectFromId(post.postID);
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
  };

  handleBoardTagsUpdateEvent = (board: Board) => {
    this.board = board;
  };

  handleBoardTaskUpdateEvent = (board: Board) => {
    this.board = board;
  };

  showBucketsModal() {
    this._openDialog(BucketsModalComponent, {
      board: this.board,
      user: this.user,
      centerX: this.canvas.getCenter().left,
      centerY: this.canvas.getCenter().top,
    });
  }

  showListModal() {
    this._openDialog(ListModalComponent, {
      board: this.board,
    });
  }

  configureBoard() {
    const map = this.activatedRoute.snapshot.paramMap;

    if (map.has('boardID') && map.has('projectID')) {
      this.boardID = this.activatedRoute.snapshot.paramMap.get('boardID') ?? '';
      this.projectID =
        this.activatedRoute.snapshot.paramMap.get('projectID') ?? '';
      this.traceService.setTraceContext(this.projectID, this.boardID);
    } else {
      this.router.navigate(['error']);
    }

    this.postService.getAllByBoard(this.boardID).then((data) => {
      data.forEach(async (post) => {
        if (post.type == PostType.BOARD) {
          const likes = await this.likesService.getLikesByPost(post.postID);
          const comments = await this.commentService.getCommentsByPost(
            post.postID
          );
          this.canvas.add(
            new FabricPostComponent(post, {
              likes: likes.length,
              comments: comments.length,
            })
          );
        }
      });
      this.boardService.get(this.boardID).then((board) => {
        if (board) {
          this.board = board;
          this.configureZoom();
          this.fabricUtils.setBackgroundImage(
            board.bgImage?.url,
            board.bgImage?.imgSettings
          );
          this.lockPostsMovement(
            !board.permissions.allowStudentMoveAny &&
              this.user.role == Role.STUDENT
          );
          this.updateShowAddPost(this.board.permissions);
          this.setAuthorVisibilityAll();
        }
      });
    });
    this.projectService
      .get(this.projectID)
      .then((project) => (this.project = project));
  }

  configureZoom() {
    if (this.board.initialZoom) {
      const zoom = this.board.initialZoom / 100;
      this.zoom = parseFloat(zoom.toPrecision(2));
      this.handleZoom('setZoom');
    } else {
      this.zoom = 1;
    }
  }

  openWorkflowDialog() {
    this._openDialog(CreateWorkflowModalComponent, {
      board: this.board,
      project: this.project,
    });
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

  openSettingsDialog() {
    this._openDialog(ConfigurationModalComponent, {
      board: this.board,
      update: (board: Board) => {
        const previousBoard = this.board;
        this.board = board;

        if (previousBoard.initialZoom !== board.initialZoom) {
          this.configureZoom();
        }
      },
    });
  }

  lockPostsMovement(value) {
    this.canvas.getObjects().map((obj) => {
      obj.set({ lockMovementX: value, lockMovementY: value });
    });
    this.canvas.renderAll();
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
      action: { name: 'View Full Task!', run: openDialogCloseSnack },
      matSnackbarConfig: {
        verticalPosition: 'bottom',
        horizontalPosition: 'center',
        panelClass: ['wide-snackbar'],
      },
    });
  }

  initLikeClickListener() {
    this.canvas.on('mouse:down', this.handleLikeClick);

    return () => {
      this.canvas.off('mouse:down', this.handleLikeClick);
    };
  }

  handleLikeClick = async (e: fabric.IEvent) => {
    const post: any = e.target;
    const likeButton = e.subTargets?.find((o) => o.name == 'like');
    const isStudent = this.user.role == Role.STUDENT;
    const isTeacher = this.user.role == Role.TEACHER;
    const studentHasPerm =
      isStudent && this.board.permissions.allowStudentLiking;
    if (likeButton && (studentHasPerm || isTeacher)) {
      const isLiked = await this.likesService.isLikedBy(
        post.postID,
        this.user.userID
      );
      if (!isLiked) {
        const like: Like = {
          likeID: Utils.generateUniqueID(),
          likerID: this.user.userID,
          postID: post.postID,
          boardID: this.board.boardID,
        };
        await this.canvasService.like(like);
      } else {
        await this.canvasService.unlike(this.user.userID, isLiked.postID);
      }
    }
  };

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

      const likePress = e.subTargets?.find((o) => o.name == 'like');
      const isDragEnd = isDragging;
      isDragging = false;
      isMouseDown = false;

      if (!isDragEnd && !likePress && obj?.name == 'post') {
        this.canvas.discardActiveObject().renderAll();
        this._openDialog(PostModalComponent, {
          user: this.user,
          post: obj,
          board: this.board,
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

    const handleDroppedPost = (e) => {
      if (!isMovingPost) return;

      let obj = e.target;
      isMovingPost = false;

      obj = this.fabricUtils.setFillColor(obj, POST_COLOR);
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
      if (this.mode == Mode.PAN) {
        isPanning = true;
        this.canvas.selection = false;
        const options = opt.e as unknown as WheelEvent;
        this.initialClientX = options.clientX;
        this.initialClientY = options.clientY;
      }
    };

    const mouseUp = (opt) => {
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

  private _openDialog(component: ComponentType<unknown>, data: any) {
    this.dialog.open(component, {
      maxWidth: 1280,
      width: '95vw',
      autoFocus: false,
      data: data,
    });
  }

  private _postsMovementAllowed() {
    if (!this.user || !this.board) return false;

    const isTeacher = this.user.role == Role.TEACHER;
    const isStudent = this.user.role == Role.STUDENT;
    const allowStudentMovement = this.board.permissions.allowStudentMoveAny;

    return isTeacher || (isStudent && allowStudentMovement);
  }

  async ngOnDestroy() {
    this.unsubListeners.forEach((s) => s.unsubscribe());
    this.socketService.disconnect(this.user.userID, this.boardID);
    this.snackbarService.ngOnDestroy();
  }
}
