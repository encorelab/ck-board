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
import { PostComponent } from '../post/post.component';
import { AddPostComponent } from '../add-post-modal/add-post.component';
import { FabricUtils } from 'src/app/utils/FabricUtils';
import { Mode } from 'src/app/utils/Mode';
import { UserService } from 'src/app/services/user.service';
import { Board } from 'src/app/models/board';
import User from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { CommentService } from 'src/app/services/comment.service';
import { LikesService } from 'src/app/services/likes.service';
import Like from 'src/app/models/like';
import { Permissions } from 'src/app/models/permissions';
import { ThrowStmt } from '@angular/compiler';

// hard-coded for now
// const this.boardID = '13n4jrf2r32fj'

interface PostIDNamePair{
  postID:string,
  username:string
}

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss']
})
export class CanvasComponent {
  boardID: string
  canvas: Canvas;

  user: User
  board: Board

  mode: Mode = Mode.EDIT
  modeType = Mode
  fabricUtils: FabricUtils = new FabricUtils()

  showAddPost:boolean

  constructor(public postsService: PostService, public boardService: BoardService, 
    public userService: UserService, public authService: AuthService, public commentService: CommentService, 
    public likesService: LikesService, public dialog: MatDialog, private route: Router) {}

  ngOnInit() {
    this.user = this.authService.userData;
    this.boardID = this.route.url.replace('/canvas/', '');
    this.canvas = new fabric.Canvas('canvas', this.fabricUtils.canvasConfig);
   
    this.configureBoard();
    this.addObjectListener();
    this.removeObjectListener();
    this.movingObjectListener();
    this.zoomListener();
    this.panningListener();
    this.expandPostListener();
    this.addCommentListener();
    this.addLikeListener();
    this.handleLikeButtonClick();
    this.postsService.observable(this.boardID, this.handleAddFromGroup, this.handleModificationFromGroup);
    this.boardService.observable(this.boardID, this.handleBoardChange);
    this.showAddPost = true
    
    
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
          if(!(
                  (this.user.role =="student" && this.board.permissions.showAuthorNameStudent) 
              ||  (this.user.role =="teacher" && this.board.permissions.showAuthorNameTeacher)
              )){
              this.hideAuthorNames()
          }
          else{
            let postIDNamePair= new Array<PostIDNamePair>()
            data.forEach((data) => {
              let post = data.data() ?? {}
              let uid = post.userID; 
              this.userService.getOneById(uid).then((user:any)=>{
                postIDNamePair.push({postID:post.postID, username:user.username})
              })
            })
            this.updateAuthorNames(postIDNamePair)

          }
        } 
      })
    })
  }

  // open dialog to get message for a new post
  handleCreatePost() {
    this.mode = Mode.CHOOSING_LOCATION
    this.canvas.defaultCursor = 'copy'
    this.canvas.hoverCursor = 'not-allowed'
    this.canvas.on('mouse:down', this.handleChoosePostLocation);
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
    var fabricPost = new PostComponent({ 
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
        var vptCoords = this.canvas.vptCoords
        var width = this.canvas.getWidth(), height = this.canvas.getHeight()
        if (vptCoords) {
          width = Math.abs(vptCoords.tr.x - vptCoords.tl.x)
          height = Math.abs(vptCoords.br.y - vptCoords.tr.y)
        }

        const imgSettings = {
          top: vptCoords?.tl.y,
          left: vptCoords?.tl.x,
          width: width,
          height: height,
          scaleX: width / (img.width ?? 0),
          scaleY: height / (img.height ?? 0)
        }
        this.canvas.setBackgroundImage(img, this.canvas.renderAll.bind(this.canvas), imgSettings);
        this.boardService.update(this.boardID, { bgImage: { url: url, imgSettings: imgSettings } })
      }
    });
  }

  updatePostPermissions = (permissions:Permissions) => {
    this.boardService.update(this.boardID, { permissions:permissions})
    this.lockPostsMovement(!permissions.allowStudentMoveAny)
    this.updateShowAddPost(permissions)
  }

  updateShowAddPost(permissions:Permissions) {
    this.showAddPost = (this.user.role =="student" && permissions.allowStudentEditAddDeletePost) || this.user.role =="teacher"
  }
  
  updateTask = (title, message) => {
    this.boardService.update(this.boardID, { task: { title: title, message: message } })
  }

  updatePublic = (isPublic) => {
    this.boardService.update(this.boardID, { public: isPublic })
  }

  lockPostsMovement(value) {
    this.canvas.getObjects().map(obj => {
      obj.set({lockMovementX: value, lockMovementY: value});
    });
    this.canvas.renderAll()
  }

  hideAuthorNames(){
    this.canvas.getObjects().map(obj => {
      this.fabricUtils.updateAuthor(obj, "Anonymous")
    });
    this.canvas.renderAll()
  }

  updateAuthorNames(postsToUpdate:Array<PostIDNamePair>){
    postsToUpdate.forEach((pair)=>{
      let obj = this.fabricUtils.getObjectFromId(this.canvas,pair.postID)
      this.fabricUtils.updateAuthor(obj, pair.username)
    })
  }

  showAuthorNames(){
    this.canvas.getObjects().map(obj => {
      this.fabricUtils.updateAuthor(obj, "Anonymous", true)
    });
    this.canvas.renderAll()
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

  // remove post from board
  removePost = (postID: string) => {
    var obj = this.fabricUtils.getObjectFromId(this.canvas, postID);
    if (!obj || obj.type != 'group') return;
    this.canvas.remove(obj);
    this.canvas.renderAll();
  };

  updatePost = (postID, title, desc) => {
    var obj: any = this.fabricUtils.getObjectFromId(this.canvas, postID);
    
    obj = this.fabricUtils.updatePostTitleDesc(obj, title, desc)
    obj.set({ title: title, desc: desc })
    this.canvas.renderAll()

    obj = JSON.stringify(obj.toJSON(this.fabricUtils.serializableProperties))
    this.postsService.update(postID, { fabricObject: obj, title: title, desc: desc })
  }

  // send your post to the rest of the group
  sendObjectToGroup(pObject: any){
    const post:Post = {
      postID: pObject.postID,
      title: pObject.title,
      desc: pObject.desc,
      tags: [],
      userID: this.user.id,
      boardID: this.boardID,
      fabricObject: JSON.stringify(pObject.toJSON(this.fabricUtils.serializableProperties))
    }
    this.postsService.create(post);
  }

  // sync board using incoming/outgoing posts
  syncBoard(obj:any, postID:any){
    var existing = this.fabricUtils.getObjectFromId(this.canvas, postID)

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
      existing.set(obj)
      existing.setCoords()
      this.canvas.renderAll()
    } else {
      this.fabricUtils.renderPostFromJSON(obj, (objects) => {
        var origRenderOnAddRemove = this.canvas.renderOnAddRemove;
        this.canvas.renderOnAddRemove = false;

        objects.forEach((o: fabric.Object) => this.canvas.add(o));

        this.canvas.renderOnAddRemove = origRenderOnAddRemove;
        this.canvas.renderAll();
      })
    }
    
  }

  addLikeListener() {
    this.likesService.observable(this.boardID, (like: Like, change: string) => {
      var post = this.fabricUtils.getObjectFromId(this.canvas, like.postID)
      if (post) {
        post = change == "added" ? this.fabricUtils.incrementLikes(post) : this.fabricUtils.decrementLikes(post)
        this.canvas.renderAll()
        var jsonPost = JSON.stringify(post.toJSON(this.fabricUtils.serializableProperties))
        this.postsService.update(post.postID, { fabricObject: jsonPost })
      }
    }, true)
  }

  handleLikeButtonClick() {
    this.canvas.on('mouse:down', e => {
      var post: any = e.target
      var likeButton = e.subTargets?.find(o => o.name == 'like')
      if (likeButton && ((this.user.role =="student" && this.board.permissions.allowStudentLiking) || this.user.role =="teacher") ) {
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
            board: this.board,
            removePost: this.removePost, 
            updatePost: this.updatePost,
          }
        });
      }
    });
  }

  addCommentListener() {
    this.commentService.observable(this.boardID, (comment: Comment) => {
      var post = this.fabricUtils.getObjectFromId(this.canvas, comment.postID)
      if (post) {
        post = this.fabricUtils.incrementComments(post)
        this.canvas.renderAll()
        var jsonPost = JSON.stringify(post.toJSON(this.fabricUtils.serializableProperties))
        this.postsService.update(post.postID, { fabricObject: jsonPost })
      }
    }, true)
  }

  // listen to configuration/permission changes
  handleBoardChange = (board) => {
    this.board = board
    this.lockPostsMovement(!board.permissions.allowStudentMoveAny)
    board.bgImage ? this.updateBackground(board.bgImage.url, board.bgImage.imgSettings) : null
    board.name ? this.updateBoardName(board.name) : null
  }

  handleAddFromGroup = (post) => {
    if (post) {
      var obj = JSON.parse(post.fabricObject);
      this.syncBoard(obj, post.postID);
    }
  }

  handleModificationFromGroup = (post) => {
    if (post) {
      var obj = JSON.parse(post.fabricObject);
      this.syncBoard(obj, post.postID);
    }
  }

  // perform actions when new post is added
  addObjectListener() {
    this.canvas.on('object:added', (options:any) => {
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
    this.canvas.on('object:removed', (options:any) => {
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
    this.canvas.on('object:moving', (options:any) => {
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

      var delta = options.deltaY;
      var zoom = this.canvas.getZoom();

      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.01) zoom = 0.01;

      this.canvas.zoomToPoint(new fabric.Point(options.offsetX, options.offsetY), zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });
  }

  panningListener() {
    var isPanning = false;

    this.canvas.on("mouse:down", (opt) => {
      if (this.mode == Mode.PAN) {
        isPanning = true;
        this.canvas.selection = false;
      }
    });
      
    this.canvas.on("mouse:up", (opt) => {
      isPanning = false;
      this.canvas.selection = true;
    });

    this.canvas.on("mouse:move", (opt) => {
      var options = (opt.e as unknown) as WheelEvent
      if (isPanning && options) {
        let delta = new fabric.Point(options.movementX, options.movementY);
        this.canvas.relativePan(delta);
      }
    })
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

  
}

