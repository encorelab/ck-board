import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Board } from 'src/app/models/board';
import User from 'src/app/models/user';
import { BucketService } from 'src/app/services/bucket.service';
import { PostService } from 'src/app/services/post.service';
import { AddPostComponent, AddPostDialog } from 'src/app/components/add-post-modal/add-post.component';
import Post, { PostType, Tag } from 'src/app/models/post';
import { FabricPostComponent } from '../fabric-post/fabric-post.component';
import { FabricUtils } from 'src/app/utils/FabricUtils';
import { fabric } from 'fabric';
import { NEEDS_ATTENTION_TAG, POST_COLOR, POST_DEFAULT_BORDER, POST_DEFAULT_BORDER_THICKNESS, POST_TAGGED_BORDER_THICKNESS, SocketEvent } from 'src/app/utils/constants';
import { SocketService } from 'src/app/services/socket.service';
import { CanvasService } from 'src/app/services/canvas.service';


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
    public canvasService: CanvasService,
    public bucketService: BucketService,
    public postsService:PostService,
    public socketService: SocketService,
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

  openAddPostDialog() {
    if (!this.activeBucket) {
      return;
    }

    const dialogData: AddPostDialog = {
      type: PostType.BUCKET,
      spawnPosition: {
        top: 150,
        left: 150,
      },
      board: this.board,
      bucket: this.activeBucket,
      user: this.user,
      onComplete: (post: Post) => this.posts.push(post)
    }
    this.dialog.open(AddPostComponent, {
      width: '500px',
      data: dialogData
    });
  }

  movePostToBoard(postID:string){
    this.postsService.get(postID).then(post => {
      const containsAttentionTag = post.tags.find(tag => tag.name == NEEDS_ATTENTION_TAG.name);

      let fabricPost = new FabricPostComponent({
        postID: postID,
        boardID: this.board.boardID,
        title: post.title,
        author: this.user.username,
        authorID: this.user.id,
        desc: post.desc,
        tags: post.tags ?? [],
        lock: !this.board.permissions.allowStudentMoveAny,
        left: this.Xoffset,
        top: this.Yoffset,
        color: POST_COLOR,
        stroke: containsAttentionTag ? NEEDS_ATTENTION_TAG.color : null,
        strokeWidth: containsAttentionTag ? POST_TAGGED_BORDER_THICKNESS : null
      });

      const canvasPost: Post = this.fabricUtils.fromFabricPost(fabricPost);
      this.canvasService.createBoardPostFromBucket(canvasPost);

      this.Yoffset += 50;
    })
  }
}
