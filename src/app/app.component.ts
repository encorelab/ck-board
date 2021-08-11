import { Component } from '@angular/core';
import { fabric } from 'fabric';
import { AngularFireDatabase } from '@angular/fire/database';
import { DialogComponent } from './components/dialog/dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { PostService } from './services/post.service';
import { first, skip } from 'rxjs/operators';
import { Canvas } from 'fabric/fabric-impl';
import { PostComponent } from './components/post/post.component';
import Post from './models/post';
import { DialogInterface } from './interfaces/dialog.interface';
import { ConfigurationModalComponent } from './components/configuration-modal/configuration-modal.component';
import { TaskModalComponent } from './components/task-modal/task-modal.component';
import { ConfigService } from './services/config.service';
import { PostModalComponent } from './components/post-modal/post-modal.component';

// hard-coded for now
const AUTHOR = 'Ammar-T'
const AUTHOR_TYPE = 'STUDENT'
const GROUP_ID = 'Science Group'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  canvas: Canvas;
  postsService: PostService
  configService: ConfigService
  config: any

  constructor(db: AngularFireDatabase, public dialog: MatDialog) {
    this.postsService = new PostService(db, GROUP_ID);
    this.configService = new ConfigService(db, GROUP_ID);
  }

  ngOnInit() {
    this.canvas = new fabric.Canvas('canvas', { width: window.innerWidth * 0.9, height: window.innerHeight * 0.8 });
    this.configureBoard();
    this.addObjectListener();
    this.removeObjectListener();
    this.movingObjectListener();
    this.zoomListener();
    this.panningListener();
    this.groupPostsListener();
    this.configListener();
  }

  // configure board
  configureBoard() {
    this.postsService.observable().pipe(first()).subscribe((data:any) => {
      data.map((post) => {
        var obj = JSON.parse(post.fabricObject); 
        this.syncBoard(obj, post.postID);
      })
      this.applySettings();
    });
  }

  // apply board settings/configuration
  applySettings() {
    this.configService.get().then((config) => {
      this.config = config
      config.allowStudentMoveAny ? this.lockPostsMovement(false) : this.lockPostsMovement(true)
      config.bgImage ? this.updateBackground(config.bgImage.url, config.bgImage.imgSettings) : null
    })
  }

  // render JSON objects when queried from firebase storage
  renderPostFromJSON(post:any) {
    fabric.util.enlivenObjects([post], (objects:any) => {
      var origRenderOnAddRemove = this.canvas.renderOnAddRemove;
      this.canvas.renderOnAddRemove = false;
     
      objects.forEach((o: fabric.Object) => {
        this.popModalListener(o)
        this.canvas.add(o);
      });
    
      this.canvas.renderOnAddRemove = origRenderOnAddRemove;
      this.canvas.renderAll();
    }, "fabric");
  }

  // open dialog to get message for a new post
  openNewPostDialog() {
    const dialogData: DialogInterface = {
      addPost: this.addPost
    }

    this.dialog.open(DialogComponent, {
      width: '500px',
      data: dialogData
    });
  }
  
  addPost = (title: string, desc = '') => {
    var fabricPost = new PostComponent({ title: title, author: AUTHOR, desc: desc, lock: !this.config.allowStudentMoveAny });
    this.canvas.add(fabricPost);
    this.popModalListener(fabricPost);
  }

  async openSettingsDialog() {
    this.dialog.open(ConfigurationModalComponent, {
      width: '500px',
      data: {
        updatePermissions: this.updatePostPermissions,
        updateBackground: this.updateBackground,
        updateBoardName: this.updateBoardName,
        allowStudentMoveAny: await this.configService.get().then((value) => value.allowStudentMoveAny)
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
  removePost = () => {
    var obj = this.canvas.getActiveObject();
    if (!obj || obj.type != 'group') return;
  
    this.canvas.remove(obj);
    this.canvas.renderAll();
  };

  updatePost = (postID, title, desc) => {
    var obj: any = this.getObjectFromId(this.canvas, postID);
    
    obj = this.updateTitleDesc(obj, title, desc)
    obj.set({ title: title, desc: desc })
    this.canvas.renderAll()

    obj = JSON.stringify(obj.toJSON(['name', 'postID', 'title', 'desc', 'author', 'hasControls', 'removed']))
    this.postsService.update(postID, { fabricObject: obj, title: title, desc: desc })
  }

  updateTitleDesc(obj: any, title: string, desc: string) {
    var children: fabric.Object[] = obj.getObjects()
    var titleObj: any = children.filter((obj) => obj.name == 'title').pop()
    var authorObj: any = children.filter((obj) => obj.name == 'author').pop()
    var descObj: any = children.filter((obj) => obj.name == 'desc').pop()
    var contentObj: any = children.filter((obj) => obj.name == 'content').pop()

    var oldTitleHeight = titleObj.height
    var oldDescHeight = descObj.height
    var oldAuthorHeight = authorObj.height
    titleObj.set({ text: title, dirty: true })
    descObj.set({ text: desc.length > 200 ? desc.substr(0, 200) + '...' : desc, dirty: true })
    
    authorObj.set({ top: authorObj.top + (titleObj.height - oldTitleHeight), dirty: true })
    descObj.set({ top: descObj.top + (titleObj.height - oldTitleHeight) + (authorObj.height - oldAuthorHeight), dirty: true })
    contentObj.set({ height: contentObj.height + (titleObj.height - oldTitleHeight) + (descObj.height - oldDescHeight), dirty: true })

    obj.dirty = true
    obj.addWithUpdate();
    return obj
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
      fabricObject: JSON.stringify(pObject.toJSON(['name', 'postID', 'title', 'desc', 'author', 'hasControls', 'removed']))
    }
    this.postsService.create(post);
  }

  // get post object using the postID
  getObjectFromId(ctx: any, postID: string){
    var currentObjects = ctx.getObjects();
    
    for (var i = currentObjects.length - 1; i >= 0; i-- ) {
      if (currentObjects[i].postID == postID)
        return currentObjects[i]
    }
    return null;
  }

  // sync board using incoming/outgoing posts
  syncBoard(obj:any, postID:any){
    var existing = this.getObjectFromId(this.canvas, postID)

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
        existing = this.updateTitleDesc(existing, obj.title, obj.desc)
        existing.desc = obj.desc
        existing.title = obj.title
      }
      
      existing.set(obj)
      existing.setCoords()
      this.canvas.renderAll()
    } else {
      this.renderPostFromJSON(obj)
    }
    
  }

  popModalListener(obj: fabric.Object) {
    var _isDragging = false;
    var _isMouseDown = false;

    obj.on('mousedown', function () {
        _isMouseDown = true;
    });

    obj.on('mousemove', function () {
        _isDragging = _isMouseDown;
    })

    obj.on('mouseup', (e) => {
        _isMouseDown = false;
        var isDragEnd = _isDragging;
        _isDragging = false;
        if (!isDragEnd) {
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
        obj = JSON.stringify(obj.toJSON(['name', 'postID', 'title', 'desc', 'author', 'hasControls', 'removed']))
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
      if (opt.target == null) {
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
}
