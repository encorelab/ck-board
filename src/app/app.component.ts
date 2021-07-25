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

// hard-coded for now
const USER_ID = 'Ammar-T'
const GROUP_ID = 'Science Group'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  canvas: Canvas;
  message: any;
  postsService: PostService

  constructor(db: AngularFireDatabase, public dialog: MatDialog) {
    this.postsService = new PostService(db, GROUP_ID);
  }

  ngOnInit() {
    this.canvas = new fabric.Canvas('canvas');
    this.retrievePosts();
    this.addObjectListener();
    this.removeObjectListener();
    this.movingObjectListener();
    this.groupListener();
  }

  // pull current posts
  retrievePosts() {
    this.postsService.observable().pipe(first()).subscribe((data:any) => {
      data.map((post) => {
        var obj = JSON.parse(post.object); 
        this.syncBoard(obj, post.postID);
      })
    });
  }

  // listen to changes from group members
  groupListener() {
    this.postsService.observable().pipe(skip(1)).subscribe((data:any) => {
      data.map((post) => {
        if (post) {
          var obj = JSON.parse(post.object);
          this.syncBoard(obj, post.postID);
        }
      })
    });
  }

  // render JSON objects when queried from firebase storage
  renderPostFromJSON(post:any) {
    fabric.util.enlivenObjects([post], (objects:any) => {
      var origRenderOnAddRemove = this.canvas.renderOnAddRemove;
      this.canvas.renderOnAddRemove = false;
     
      objects.forEach((o) => {
        this.canvas.add(o);
      });
    
      this.canvas.renderOnAddRemove = origRenderOnAddRemove;
      this.canvas.renderAll();
    }, "fabric");
  }

  // open dialog to get message for a new post
  openDialog() {
    const dialogRef = this.dialog.open(DialogComponent, {
      width: '250px',
      data: { message: '' }
    });

    dialogRef.afterClosed().subscribe((message: any) => {
      var newPost = new PostComponent({ userID: USER_ID, message: message });
      this.canvas.add(newPost);
    });
  }
  
  // remove post from board
  removePost() {
    var obj = this.canvas.getActiveObject();
    if (!obj || obj.type != 'group') return;
  
    this.canvas.remove(obj);
    this.canvas.renderAll();
  };

  // send your post to the rest of the group
  sendObjectToGroup(pObject: any){
    const post:Post = {
      userID: USER_ID,
      postID: pObject.postID,
      groupID: GROUP_ID,
      object: JSON.stringify(pObject.toJSON(['postID', 'hasControls', 'removed']))
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
      // update existing object
      existing.set(obj)
      existing.setCoords()
      this.canvas.renderAll()
    } else {
      // add new object to board
      this.renderPostFromJSON(obj)
    }
    
  }

  // perform actions when new post is added
  addObjectListener() {
    this.canvas.on('object:added', (options:any) => {
      if (options.target) {
        var obj = options.target;
        
        if (!obj.postID) {
          obj.set('postID', Date.now() + '-' + USER_ID);
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
        var coords = obj.calcCoords(); 
        var left = coords.tl.x;
        var top = coords.tl.y;

        obj.set({left: left, top: top})
        obj.setCoords()
        this.canvas.renderAll()

        var id = obj.postID
        obj = JSON.stringify(obj.toJSON(['postID', 'hasControls', 'removed']))
        this.postsService.update(id, {object: obj})
      }
    })
  }
}
