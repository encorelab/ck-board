import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Board } from 'src/app/models/board';
import User from 'src/app/models/user';
import { BucketService } from 'src/app/services/bucket.service';
import { PostService } from 'src/app/services/post.service';
import { AddPostComponent, AddPostDialog } from 'src/app/components/add-post-modal/add-post.component';
import Post, { Tag } from 'src/app/models/post';
import { FabricPostComponent } from '../fabric-post/fabric-post.component';
import { FabricUtils } from 'src/app/utils/FabricUtils';
import { fabric } from 'fabric';
import { POST_COLOR } from 'src/app/utils/constants';


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

  movePostActivated:boolean

  Yoffset:number
  Xoffset:number

  constructor(
    public dialogRef: MatDialogRef<BucketsModalComponent>,
    public bucketService: BucketService,
    public postsService:PostService,
    public dialog: MatDialog,
    protected fabricUtils: FabricUtils,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.board = data.board
    this.user = data.user
    this.Xoffset = data.centerX
    this.Yoffset = data.centerY
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
      } else {
        this.loading = false
      }
    }).catch(e => console.log(e))
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

  addPost = (title: string, desc = '', tags: Tag[]) => {
    if (!this.activeBucket){
      return;
    }
    const post: Post = {
      postID: Date.now() + '-' + this.user.id,
      title: title,
      desc: desc,
      tags: tags,
      userID: this.user.id,
      boardID: this.board.boardID,
      fabricObject: null,
      timestamp: new Date().getTime(),
    }
    this.postsService.create(post);
    this.posts.push(post);
    let ids = this.posts.map(post=>post.postID)
    this.bucketService.add(this.activeBucket.bucketID, ids)
  }

  openAddPostDialog(){
    const dialogData: AddPostDialog = {
      handleAddPost: this.addPost,
      spawnPosition: {
        top: 150,
        left: 150,
      },
      board: this.board,
      user: this.user
    }
    this.dialog.open(AddPostComponent, {
      width: '500px',
      data: dialogData
    });
  }

  movePostToBoard(postID:string){
    this.postsService.get(postID).then(data =>{
      data.forEach(item =>{
        let post = item.data()
        let fabricPost = new FabricPostComponent({
          title: post.title,
          author: this.user.username,
          authorID: this.user.id,
          desc: post.desc,
          tags: [],
          lock: !this.board.permissions.allowStudentMoveAny,
          left: this.Xoffset,
          top: this.Yoffset,
          color: POST_COLOR
        });

        fabricPost = this.fabricUtils.setField(fabricPost, 'postID', postID);
        const updatedPost = this.fabricUtils.toJSON(fabricPost);
        this.postsService.update(postID, {fabricObject: updatedPost});

        this.Yoffset += 50;
      })
    })
    
  }
}
