import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Board } from 'src/app/models/board';
import User from 'src/app/models/user';
import { BucketService } from 'src/app/services/bucket.service';
import { PostService } from 'src/app/services/post.service';
import { AddPostComponent } from 'src/app/components/add-post-modal/add-post.component';
import Post from 'src/app/models/post';
import { DialogInterface } from 'src/app/interfaces/dialog.interface';


@Component({
  selector: 'app-buckets-modal',
  templateUrl: './buckets-modal.component.html',
  styleUrls: ['./buckets-modal.component.scss']
})
export class BucketsModalComponent implements OnInit, OnDestroy {

  board: Board
  user:User

  buckets: any
  activeBucket: any

  posts: any[]

  loading: boolean = true

  postsToMove:string[] =[]
  movePostActivated:boolean

  constructor(
    public dialogRef: MatDialogRef<BucketsModalComponent>,
    public bucketService: BucketService,
    public postsService:PostService,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.board = data.board
    this.user = data.user
  }

  ngOnInit(): void {
    this.fetchBuckets()
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
      .catch(_err => {
        this.posts = []
        this.loading = false
      })
  }

  ngOnDestroy(): void {
    this.activeBucket = null
    this.buckets = []
    this.posts = []
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

  handleCheckedPost(postID:string){
    alert(JSON.stringify(postID))
    if(this.postsToMove.includes(postID)){
      this.postsToMove = this.postsToMove.filter(e => e!=postID)
    }
    else{
      this.postsToMove.push(postID)
    }

  }
  activateMovePost(){
    this.movePostActivated = !this.movePostActivated
  }
}
