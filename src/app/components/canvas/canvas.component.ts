import { Component } from '@angular/core';
import { fabric } from 'fabric';
import { Canvas } from 'fabric/fabric-impl';

import { MatDialog } from '@angular/material/dialog';
import { AngularFireDatabase } from '@angular/fire/database';

import { skip } from 'rxjs/operators';

import Post from '../../models/post';
import { DialogInterface } from '../../interfaces/dialog.interface';

import { ConfigService } from '../../services/config.service';
import { PostService } from '../../services/post.service';

import { PostModalComponent } from '../post-modal/post-modal.component';
import { ConfigurationModalComponent } from '../configuration-modal/configuration-modal.component';
import { TaskModalComponent } from '../task-modal/task-modal.component';
import { PostComponent } from '../post/post.component';
import { AddPostComponent } from '../add-post-modal/add-post.component';
import { FabricUtils } from 'src/app/utils/FabricUtils';
import { Mode } from 'src/app/utils/Mode';
import { AngularFireAuth } from '@angular/fire/auth';
import { UserService } from 'src/app/services/user.service';
import { Config } from 'src/app/models/config';

// hard-coded for now
const AUTHOR = 'Ammar-T'
const AUTHOR_TYPE = 'STUDENT'
const GROUP_ID = 'Science Group'

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.scss']
})
export class CanvasComponent {
  canvas: Canvas;

  user: any
  config: Config
  
  postsService: PostService
  configService: ConfigService
  userService: UserService

  mode: Mode = Mode.EDIT
  modeType = Mode
  fabricUtils: FabricUtils = new FabricUtils()

  constructor(db: AngularFireDatabase, private afAuth: AngularFireAuth, public dialog: MatDialog) {
    this.postsService = new PostService(db, GROUP_ID);
    this.configService = new ConfigService(db, GROUP_ID);
    this.userService = new UserService(db);
    this.afAuth.onAuthStateChanged((user) => {
      this.userService.getOneById(user?.uid ?? '').then((user) => this.user = Object.values(user.val())[0])
    })
  }

  ngOnInit() {
    this.canvas = new fabric.Canvas('canvas', { width: window.innerWidth * 0.99, height: window.innerHeight * 0.9, fireRightClick: true, stopContextMenu: true });
    this.configureBoard();
    this.addObjectListener();
    this.removeObjectListener();
    this.movingObjectListener();
    this.zoomListener();
    this.panningListener();
    this.expandPostListener();
    this.groupPostsListener();
    this.configListener();
  }

  // configure board
  configureBoard() {
    this.postsService.getAll().then((data) => {
      let posts = data.val() ?? {}
      Object.values(posts).map((post: any) => {
        var obj = JSON.parse(post.fabricObject); 
        this.syncBoard(obj, post.postID);
      });
      this.configService.get().then((config) => {
        this.config = config
        config.allowStudentMoveAny ? this.lockPostsMovement(false) : this.lockPostsMovement(true)
        config.bgImage ? this.updateBackground(config.bgImage.url, config.bgImage.imgSettings) : null
      })
    });
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
        top: opt.pointer ? opt.pointer.y : 150,
        left: opt.pointer ? opt.pointer.x : 150,
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
    var fabricPost = new PostComponent({ title: title, author: AUTHOR, desc: desc, lock: !this.config.allowStudentMoveAny, left: left, top: top });
    this.canvas.add(fabricPost);
  }

  openSettingsDialog() {
    this.dialog.open(ConfigurationModalComponent, {
      width: '500px',
      data: {
        updatePermissions: this.updatePostPermissions,
        updateBackground: this.updateBackground,
        updateBoardName: this.updateBoardName,
        allowStudentMoveAny: this.config.allowStudentMoveAny
      }
    });
  }

  updateBoardName = (name) => {
    this.config.boardName = name
    this.configService.update({ boardName: name })
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
        this.configService.update({ bgImage: { url: url, imgSettings: imgSettings } })
      }
    });
  }

  updatePostPermissions = (value) => {
    this.configService.update({ allowStudentMoveAny: !value })
    this.lockPostsMovement(value)
  }
  
  lockPostsMovement(value) {
    this.canvas.getObjects().map(obj => {
      obj.set({lockMovementX: value, lockMovementY: value});
    });
    this.canvas.renderAll()
  }

  openTaskDialog() {
    this.dialog.open(TaskModalComponent, {
      width: '500px',
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
      title: pObject.title,
      desc: pObject.desc,
      author: AUTHOR,
      authorType: AUTHOR_TYPE,
      postID: pObject.postID,
      groupID: GROUP_ID,
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
      var obj = e.target;
      isMouseDown = false;
      var isDragEnd = isDragging;
      isDragging = false;
      if (!isDragEnd && this.mode == Mode.EDIT && obj?.name == 'post') {
        this.canvas.discardActiveObject().renderAll();
        this.dialog.open(PostModalComponent, {
          width: '500px',
          data: { post: obj, removePost: this.removePost, updatePost: this.updatePost }
        });
      }
    });
  }

  // listen to configuration/permission changes
  configListener() {
    this.configService.observable().pipe(skip(1)).subscribe((config:any) => {
      this.config = config
      this.lockPostsMovement(!config.allowStudentMoveAny)
      config.bgImage ? this.updateBackground(config.bgImage.url, config.bgImage.imgSettings) : null
      config.boardName ? this.updateBoardName(config.boardName) : null
    });
  }

  // listen to changes from group members
  groupPostsListener() {
    this.postsService.observable().pipe(skip(1)).subscribe((data:any) => {
      data.map((post) => {
        if (post) {
          var obj = JSON.parse(post.fabricObject);
          this.syncBoard(obj, post.postID);
        }
      })
    });
  }

  // perform actions when new post is added
  addObjectListener() {
    this.canvas.on('object:added', (options:any) => {
      if (options.target) {
        var obj = options.target;
        
        if (!obj.postID) {
          obj.set('postID', Date.now() + '-' + AUTHOR);
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
