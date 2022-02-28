import { Component } from '@angular/core';
import { fabric } from 'fabric';
import { Canvas } from 'fabric/fabric-impl';

import { MatDialog } from '@angular/material/dialog';

import Post from '../../models/post';
import Comment from 'src/app/models/comment';
import { DialogInterface } from '../../interfaces/dialog.interface';

import { BoardService } from '../../services/board.service';
import { PostService } from '../../services/post.service';

import { PostModalComponent } from '../post-modal/post-modal.component';
import { ConfigurationModalComponent } from '../configuration-modal/configuration-modal.component';
import { TaskModalComponent } from '../task-modal/task-modal.component';
import { FabricPostComponent } from '../fabric-post/fabric-post.component';
import { AddPostComponent } from '../add-post-modal/add-post.component';
import { FabricUtils } from 'src/app/utils/FabricUtils';
import { Mode, Role } from 'src/app/utils/constants';
import { UserService } from 'src/app/services/user.service';
import { Board } from 'src/app/models/board';
import User from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { CommentService } from 'src/app/services/comment.service';
import { LikesService } from 'src/app/services/likes.service';
import Like from 'src/app/models/like';
import { Permissions } from 'src/app/models/permissions';
import { CreateWorkflowModalComponent } from '../create-workflow-modal/create-workflow-modal.component';
import { RealtimeService } from 'src/app/services/realtime.service';
import { BucketsModalComponent } from '../buckets-modal/buckets-modal.component';
import { ListModalComponent } from '../list-modal/list-modal.component';

interface PostIDNamePair {
  postID: string,
  username: string
}

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss']
})
export class CanvasComponent {
  boardID: string
  projectID: string
  canvas: Canvas;

  user: User
  board: Board

  centerX: number
  centerY: number
  initialClientX: number = 0
  initialClientY: number = 0
  finalClientX: number = 0
  finalClientY: number = 0

  zoom: number = 1

  mode: Mode = Mode.EDIT
  modeType = Mode 
  Role: typeof Role = Role

  showList: boolean = false
  showBuckets: boolean = false

  showAddPost: boolean = true

  constructor(public postsService: PostService, public boardService: BoardService, 
    public userService: UserService, public authService: AuthService, public commentService: CommentService, 
    public likesService: LikesService, public realtimeService: RealtimeService, public dialog: MatDialog, private route: Router,
    protected fabricUtils: FabricUtils) {}

  ngOnInit() {
    this.user = this.authService.userData;
    this.parseUrl(this.route.url);
    this.canvas = new fabric.Canvas('canvas', this.fabricUtils.canvasConfig);
    this.fabricUtils._canvas = this.canvas
    this.centerX = this.canvas.getWidth() / 2;
    this.centerY = this.canvas.getHeight() / 2;
    this.displayZoomValue();
    this.configureBoard();
    this.addObjectListener();
    this.removeObjectListener();
    this.movingObjectListener();
    this.zoomListener();
    this.panningListener();
    this.panningBySwipingListener();
    this.keyPanningListener();
    this.expandPostListener();
    this.handleLikeButtonClick();
    this.hideListsWhenModalOpen();
    this.boardService.observable(this.boardID, this.handleBoardChange);
    this.realtimeService.observe(this.boardID, this.handlePostEvent, this.handleLikeEvent, this.handleCommentEvent);
  }

  showBucketsModal() {
    this.dialog.open(BucketsModalComponent, {
      width: '73vw',
      height: '75vh',
      data: {
        board: this.board,
        user:this.user,
        centerX:this.centerX,
        centerY:this.centerY
      }
    });
  }

  showListModal() {
    this.dialog.open(ListModalComponent, {
      width: '73vw',
      height: '75vh',
      data: {
        board: this.board,
      }
    });
  }

  // configure board
  configureBoard() {
    this.postsService.getAll(this.boardID).then((data) => {
      data.forEach((data) => {
        let post = data.data() ?? {}
        let obj = JSON.parse(post.fabricObject);
        this.syncBoard(obj, post.postID);
      })
      this.boardService.get(this.boardID).then((board) => {
        if (board) {
          this.board = board
          board.permissions.allowStudentMoveAny ? this.lockPostsMovement(false) : this.lockPostsMovement(true)
          board.bgImage ? this.updateBackground(board.bgImage.url, board.bgImage.imgSettings) : null
          this.updateShowAddPost(this.board.permissions)
          this.setAuthorVisibilityAll()
        }
      })
    })
  }

  openWorkflowDialog() {
    this.dialog.open(CreateWorkflowModalComponent, {
      width: '700px',
      data: {
        board: this.board,
      }
    });
  }

  // open dialog to get message for a new post
  handleCreatePost() {
    this.mode = Mode.CHOOSING_LOCATION
    this.canvas.defaultCursor = 'copy'
    this.canvas.hoverCursor = 'not-allowed'
    this.canvas.on('mouse:down', this.handleChoosePostLocation);
  }

  parseUrl =(url:string)=>{
    // /project/[projectid]/board/[boardid]
    let urlArr = url.split('/')
    this.boardID = urlArr[urlArr.length-1];
    this.projectID = urlArr[urlArr.length-3];

  }
  
  handleChoosePostLocation = (opt) => {
    if (opt.target == null) {
      this.canvas.selection = false;
      const dialogData: DialogInterface = {
        addPost: this.addPost,
        top: opt.absolutePointer ? opt.absolutePointer.y : 150,
        left: opt.absolutePointer ? opt.absolutePointer.x : 150,
      }
      this.dialog.open(AddPostComponent, {
        width: '500px',
        data: dialogData
      });
    }
    this.canvas.off('mouse:down', this.handleChoosePostLocation)
    this.enableEditMode()
  }

  disableChooseLocation() {
    this.canvas.off('mouse:down', this.handleChoosePostLocation)
    this.enableEditMode()
  }

  addPost = (title: string, desc = '', left: number, top: number) => {
    var fabricPost = new FabricPostComponent({
      title: title,
      author: this.user.username,
      authorID: this.user.id,
      desc: desc,
      lock: !this.board.permissions.allowStudentMoveAny,
      left: left,
      top: top
    });
    this.canvas.add(fabricPost);
  }
  
  openSettingsDialog() {
    this.dialog.open(ConfigurationModalComponent, {
      width: '850px',
      data: {
        board: this.board,
        updatePermissions: this.updatePostPermissions,
        updatePublic: this.updatePublic,
        updateTask: this.updateTask,
        updateBackground: this.updateBackground,
        updateBoardName: this.updateBoardName,
        updateTags: this.updateTags
      }
    });
  }

  updateTags = (tags) => {
    this.boardService.update(this.boardID, { tags: tags })
  }

  updateBoardName = (name) => {
    this.board.name = name
    this.boardService.update(this.boardID, { name: name })
  }

  updateBackground = (url, settings?) => {
    fabric.Image.fromURL(url, (img) => {
      if (img && settings) {
        this.canvas.setBackgroundImage(img, this.canvas.renderAll.bind(this.canvas), settings);
      } else if (img) {
        const imgSettings = this.fabricUtils.createImageSettings(this.canvas, img)
        this.canvas.setBackgroundImage(img, this.canvas.renderAll.bind(this.canvas), imgSettings);
        this.boardService.update(this.boardID, { bgImage: { url: url, imgSettings: imgSettings } })
      } else {
        this.canvas.setBackgroundImage('', this.canvas.renderAll.bind(this.canvas))
        this.boardService.update(this.boardID, { bgImage: null })
      }
    });
  }

  updatePostPermissions = (permissions: Permissions) => {
    this.boardService.update(this.boardID, { permissions: permissions })
    this.lockPostsMovement(!permissions.allowStudentMoveAny)
    this.updateShowAddPost(permissions)
    this.configureBoard()
  }

  updateShowAddPost(permissions: Permissions) {
    let isStudent = this.user.role == Role.STUDENT
    let isTeacher = this.user.role == Role.TEACHER
    this.showAddPost = (isStudent && permissions.allowStudentEditAddDeletePost) || isTeacher
  }

  updateTask = (title, message) => {
    this.boardService.update(this.boardID, { task: { title: title, message: message } })
  }

  updatePublic = (isPublic) => {
    this.boardService.update(this.boardID, { public: isPublic })
  }

  lockPostsMovement(value) {
    this.canvas.getObjects().map(obj => {
      obj.set({ lockMovementX: value, lockMovementY: value });
    });
    this.canvas.renderAll()
  }

  hideAuthorNames() {
    this.canvas.getObjects().map(obj => {
      this.fabricUtils.updateAuthor(obj, "Anonymous")
    });
    this.canvas.renderAll()
  }

  updateAuthorNames(postToUpdate: PostIDNamePair) {
    let obj = this.fabricUtils.getObjectFromId(postToUpdate.postID)
    if(obj){
      this.fabricUtils.updateAuthor(obj, postToUpdate.username)
      this.canvas.renderAll()
    }
  }
  
  setAuthorVisibilityOne(post){
    if(!this.board){
      return
    }
    let isStudentAndVisible = this.user.role == Role.STUDENT && this.board.permissions.showAuthorNameStudent
    let IsTeacherAndVisisble= this.user.role == Role.TEACHER && this.board.permissions.showAuthorNameTeacher
    if (!(isStudentAndVisible || IsTeacherAndVisisble)) {
      this.updateAuthorNames({ postID: post.postID, username: "Anonymous" })
    }
    else{
      this.userService.getOneById(post.userID).then((user: any) => {
        this.updateAuthorNames({ postID: post.postID, username: user.username })
      })
    }

  }

  setAuthorVisibilityAll() {
    this.postsService.getAll(this.boardID).then((data) => {
      // update all the post names to to the poster's name rather than anonymous
      data.forEach((data) => {
        let post = data.data() ?? {}
        this.setAuthorVisibilityOne(post)
      })
    })
  }

  openTaskDialog() {
    this.dialog.open(TaskModalComponent, {
      width: '500px',
      data: {
        title: this.board.task.title,
        message: this.board.task.message ?? ''
      }
    });
  }

  // send your post to the rest of the group
  sendObjectToGroup(pObject: any) {
    console.log("Sendobject to group ran")
    const post: Post = {
      postID: pObject.postID,
      title: pObject.title,
      desc: pObject.desc,
      tags: [],
      userID: this.user.id,
      boardID: this.boardID,
      fabricObject: JSON.stringify(pObject.toJSON(this.fabricUtils.serializableProperties)),
      timestamp: new Date().getTime(),
      bucketOnly:false
    }
    this.postsService.create(post);
  }

  // sync board using incoming/outgoing posts
  syncBoard(obj:any, postID:any){
    var existing = this.fabricUtils.getObjectFromId(postID)

    // delete object from board
    if (obj.removed) {
      if (existing) {
        this.canvas.remove(existing)
      }
      return;
    }

    if (existing) {
      // if title or desc was updated, need to re-render with updated properties
      if (obj.title != existing.title || obj.desc != existing.desc) {
        existing = this.fabricUtils.updatePostTitleDesc(existing, obj.title, obj.desc)
        existing.desc = obj.desc
        existing.title = obj.title
      }

      existing = this.fabricUtils.updateLikeCount(existing, obj)
      existing = this.fabricUtils.updateCommentCount(existing, obj)
      existing.set(obj)
      existing.setCoords()
      this.canvas.renderAll()
    } else {
      this.fabricUtils.renderPostFromJSON(obj)
    }
    
  }

  handlePostEvent = (post) => {
    if (post) {
      var obj = JSON.parse(post.fabricObject);
      this.syncBoard(obj, post.postID);
    }
  }

  handleLikeEvent = (like: Like, change: string) => {
    var post = this.fabricUtils.getObjectFromId(like.postID)
    if (post) {
      post = change == "added" ? this.fabricUtils.incrementLikes(post) : this.fabricUtils.decrementLikes(post)
      this.canvas.renderAll()
      var jsonPost = JSON.stringify(post.toJSON(this.fabricUtils.serializableProperties))
      this.postsService.update(post.postID, { fabricObject: jsonPost })
    }
  }

  handleCommentEvent = (comment: Comment) => {
    var post = this.fabricUtils.getObjectFromId(comment.postID)
    if (post) {
      post = this.fabricUtils.incrementComments(post)
      this.canvas.renderAll()
      var jsonPost = JSON.stringify(post.toJSON(this.fabricUtils.serializableProperties))
      this.postsService.update(post.postID, { fabricObject: jsonPost })
    }
  }

  handleLikeButtonClick() {
    this.canvas.on('mouse:down', e => {
      var post: any = e.target
      var likeButton = e.subTargets?.find(o => o.name == 'like')
      let isStudent = this.user.role == Role.STUDENT
      let isTeacher = this.user.role == Role.TEACHER
      let studentHasPerm = isStudent && this.board.permissions.allowStudentLiking
      if (likeButton && (studentHasPerm || isTeacher)) {
        this.likesService.isLikedBy(post.postID, this.user.id).then((data) => {
          if (data.size == 0) {
            this.likesService.add({
              likeID: Date.now() + '-' + this.user.id,
              likerID: this.user.id,
              postID: post.postID,
              boardID: this.board.boardID
            })
          } else {
            data.forEach((data) => {
              let like: Like = data.data()
              this.likesService.remove(like.likeID)
            })
          }
        })
      }
    });
  }

  expandPostListener() {
    var isDragging = false;
    var isMouseDown = false;

    this.canvas.on('mouse:down', (e) => {
      if (e.target?.name == 'post') isMouseDown = true;
    });

    this.canvas.on('mouse:move', (e) => {
      if (e.target?.name == 'post') isDragging = isMouseDown;
    })

    this.canvas.on('mouse:up', (e) => {
      var obj: any = e.target;
      isMouseDown = false;
      var isDragEnd = isDragging;
      isDragging = false;
      var clickedLikeButton = e.subTargets?.find(o => o.name == 'like')
      if (!isDragEnd && !clickedLikeButton && obj?.name == 'post') {
        this.canvas.discardActiveObject().renderAll();
        this.dialog.open(PostModalComponent, {
          minWidth: '700px',
          width: 'auto',
          data: {
            user: this.user,
            post: obj,
            board: this.board
          }
        });
      }
    });
  }

  // listen to configuration/permission changes
  handleBoardChange = (board) => {
    this.board = board

    this.lockPostsMovement(!board.permissions.allowStudentMoveAny)
    this.setAuthorVisibilityAll()

    board.bgImage ? this.updateBackground(board.bgImage.url, board.bgImage.imgSettings) : null
    board.name ? this.updateBoardName(board.name) : null
  }

  // perform actions when new post is added
  addObjectListener() {
    this.canvas.on('object:added', (options: any) => {
      if (options.target) {
        var obj = options.target;

        if (!obj.postID) {
          obj.set('postID', Date.now() + '-' + this.user.id);
          fabric.util.object.extend(obj, { postID: obj.postID })
          this.sendObjectToGroup(obj)
        }
      }
    });
  }

  // perform actions when post is removed
  removeObjectListener() {
    this.canvas.on('object:removed', (options: any) => {
      if (options.target) {
        var obj = options.target;
        if (obj.removed) {
          return // already removed
        }

        this.postsService.delete(obj.postID)
        obj.set('removed', true);
        fabric.util.object.extend(obj, { removed: true })
        this.sendObjectToGroup(obj);
      }
    });
  }

  // perform actions when post is moved
  movingObjectListener() {
    this.canvas.on('object:moving', (options: any) => {
      if (options.target) {
        var obj = options.target;

        var left = (Math.round((options.pointer.x - obj.getScaledWidth() / 2)));
        var top = (Math.round((options.pointer.y - obj.getScaledHeight() / 2)));

        obj.set({ left: left, top: top })
        obj.setCoords()
        this.canvas.renderAll()

        var id = obj.postID
        obj = JSON.stringify(obj.toJSON(this.fabricUtils.serializableProperties))
        this.postsService.update(id, { fabricObject: obj })
      }
    })
  }


  zoomListener() {
    this.canvas.on('mouse:wheel', (opt) => {
      var options = (opt.e as unknown) as WheelEvent

      // Condition for pinch gesture on trackpad: 
      // 1. delta Y is an integer or delta X is 0 
      // 2. ctrl key is triggered
      const trackpad_pinch = ((Number.isInteger(options.deltaY) || Math.abs(options.deltaX) < 1e-9))
      && (options.ctrlKey);

      // Condition for mousewheel:
      // 1. delta Y has trailing non-zero decimal points
      // 2. delta X is zero 
      // 3. ctrl key is not triggered
      const mousewheel = !(Math.abs(options.deltaY - Math.floor(options.deltaY)) < 1e-9) 
      && Math.abs(options.deltaX) < 1e-9 && !(options.ctrlKey);

      if(trackpad_pinch || mousewheel) {  
        var delta = options.deltaY;

        if(mousewheel) {
          this.zoom *= 0.999 ** delta;
        }
        else {
          this.zoom *= 0.95 ** delta;
        }
        if (this.zoom > 20) this.zoom = 20;
        if (this.zoom < 0.01) this.zoom = 0.01;

        this.canvas.zoomToPoint(new fabric.Point(options.offsetX, options.offsetY), this.zoom);
        opt.e.preventDefault();
        opt.e.stopPropagation();
      }
    });
  }

  panningListener() {
    var isPanning = false;

    this.canvas.on("mouse:down", (opt) => {
      if (this.mode == Mode.PAN) {
        isPanning = true;
        this.canvas.selection = false;
        const options = (opt.e as unknown) as WheelEvent
        this.initialClientX = options.clientX;
        this.initialClientY = options.clientY;
      }
    });

    this.canvas.on("mouse:up", (opt) => {
      isPanning = false;
      this.canvas.selection = true;
      const options = (opt.e as unknown) as WheelEvent
      this.initialClientX = options.clientX;
      this.initialClientY = options.clientY;
    });

    this.canvas.on("mouse:move", (opt) => {
      var options = (opt.e as unknown) as WheelEvent
      if (isPanning && options) {
        let delta = new fabric.Point(options.movementX, options.movementY);
        this.canvas.relativePan(delta);
        this.finalClientX = options.clientX;
        this.finalClientY = options.clientY;
      }
    })
  }

  panningBySwipingListener() {
    this.canvas.on('mouse:wheel', (opt) => {
      let options = (opt.e as unknown) as WheelEvent;

      // Condition for two-finger swipe on trackpad: 
      // 1. delta Y is an integer, 
      // 2. delta X is an integer,
      // 3. ctrl key is not triggered
      const trackpad_twofinger = 
      Number.isInteger(options.deltaY) && Number.isInteger(options.deltaX)
      && !(options.ctrlKey);

      if(trackpad_twofinger) { 
        let vpt = this.canvas.viewportTransform;
        if(!vpt) return;
        vpt[4] -= options.deltaX;
        vpt[5] -= options.deltaY;
        this.canvas.requestRenderAll();
      }
    })
  }
  
  keyPanningListener() {
    document.addEventListener('keydown', (event) => {
      if(event.key == 'ArrowUp') {
        event.preventDefault();
        this.canvas.relativePan(new fabric.Point(0, 30 * this.canvas.getZoom()));
      }
      else if(event.key == 'ArrowDown') {
        event.preventDefault();
        this.canvas.relativePan(new fabric.Point(0, -30 * this.canvas.getZoom()));
      }
      else if(event.key == 'ArrowLeft') {
        event.preventDefault();
        this.canvas.relativePan(new fabric.Point(30 * this.canvas.getZoom(), 0));
      }
      else if(event.key == 'ArrowRight') {
        event.preventDefault();
        this.canvas.relativePan(new fabric.Point(-30 * this.canvas.getZoom(), 0));
      }
    });
  }

  enablePanMode() {
    this.mode = Mode.PAN
    this.lockPostsMovement(true)
    this.canvas.defaultCursor = 'grab'
    this.canvas.hoverCursor = 'grab'
  }

  enableEditMode() {
    this.mode = Mode.EDIT
    this.lockPostsMovement(false)
    this.canvas.defaultCursor = 'default'
    this.canvas.hoverCursor = 'move'
  }


  handleZoom(event) {
    let centerX = this.centerX + (this.finalClientX - this.initialClientX);
    let centerY = this.centerY + (this.finalClientY - this.initialClientY);
    this.initialClientX = this.finalClientX;
    this.initialClientY = this.finalClientY;

    if(event === 'zoomIn') {
      this.zoom += 0.05;
    }
    else if(event === 'zoomOut') {
      this.zoom -= 0.05;
    }
    else if(event === 'reset') {
      this.zoom = 1;
    }

    if(this.zoom > 20) {
      this.zoom = 20;
    }
    else if(this.zoom < 0.01) {
      this.zoom = 0.01;
    }

    this.canvas.zoomToPoint(new fabric.Point(centerX, centerY), this.zoom);
  }

  displayZoomValue() {
    return Math.round(this.zoom * 100);
  }

  hideListsWhenModalOpen() {
    this.dialog.afterOpened.subscribe(() => {
      this.showList = false
      this.showBuckets = false
    })
  }
}