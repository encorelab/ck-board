import { Component, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, SimpleChanges, ViewChild, ViewChildren } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { Board } from 'src/app/models/board';
import { BucketService } from 'src/app/services/bucket.service';
import { MatDialog } from '@angular/material/dialog';
import { AddPostComponent } from 'src/app/components/add-post-modal/add-post.component';
import { DialogInterface } from 'src/app/interfaces/dialog.interface';
import { PostComponent } from 'src/app/components/post/post.component';
import { PostService } from 'src/app/services/post.service';
import Post from 'src/app/models/post';
import User from 'src/app/models/user';
import { connectableObservableDescriptor } from 'rxjs/internal/observable/ConnectableObservable';


@Component({
  selector: 'app-bucket',
  templateUrl: './bucket.component.html',
  styleUrls: ['./bucket.component.scss']
})
export class BucketComponent implements OnChanges {

  @Input() board: Board
  @Input() user:User

  @Input() visible: boolean
  @Output() visibleChange = new EventEmitter<boolean>();

  @ViewChildren('drawer') ref: QueryList<any>
  
  loading: boolean = true

  buckets: any
  activeBucket: any

  posts: any[]

  constructor(public bucketService: BucketService,public postsService: PostService, public dialog: MatDialog) { }

  ngOnChanges() {
    if (this.visible) {
      this.ref.first.open()
      this.fetchBuckets()
    } else if (this.ref && this.ref.length > 0) {
      this.ref.first.close()
      this.loading = true
    }
  }

  fetchBuckets() {
    this.bucketService.getAllByBoard(this.board.boardID).then(buckets => {
      this.buckets = buckets
      if (buckets.length > 0) {
        this.activeBucket = this.buckets[0] 
        this.loadBucketPosts(this.activeBucket)
      }
    })
  }

  loadBucketPosts(bucket) {
    this.loading = true
    this.bucketService.get(bucket.bucketID)
      .then(bucket => {
        if (bucket) {
          this.activeBucket = bucket
          this.posts = bucket.posts
        } else {
          this.posts = []
        }
        this.loading = false
      })
      .catch(_err => this.posts = [])
  }

  close() {
    this.visibleChange.emit(false)
    this.ref.first.close()
    this.loading = true
  }

  addPost = (title: string, desc = '', left: number, top: number) => {
    if (!this.activeBucket){
      return;
    }
    const post: Post = {
      postID: Date.now() + '-' + this.user.id,
      title: title,
      desc: desc,
      tags: [],
      userID: this.user.id,
      boardID: this.board.boardID,
      fabricObject: "{}",
      timestamp: new Date().getTime(),
      bucketOnly:true
    }
    this.postsService.create(post);
    this.posts.push(post);
    let ids = this.posts.map(post=>post.postID)
    this.bucketService.update(this.activeBucket.bucketID,{posts:ids})

  }

  openAddPostDialog(){
    const dialogData: DialogInterface = {
      addPost: this.addPost,
      top: 150,
      left: 150,
    }
    this.dialog.open(AddPostComponent, {
      width: '500px',
      data: dialogData
    });
  }
}
