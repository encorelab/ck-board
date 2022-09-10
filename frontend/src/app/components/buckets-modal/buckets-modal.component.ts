import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { Board } from 'src/app/models/board';
import User from 'src/app/models/user';
import { BucketService } from 'src/app/services/bucket.service';
import { PostService } from 'src/app/services/post.service';
import {
  AddPostComponent,
  AddPostDialog,
} from 'src/app/components/add-post-modal/add-post.component';
import Post, { PostType, DisplayAttributes } from 'src/app/models/post';
import { FabricUtils } from 'src/app/utils/FabricUtils';
import {
  NEEDS_ATTENTION_TAG,
  POST_TAGGED_BORDER_THICKNESS,
  SocketEvent,
} from 'src/app/utils/constants';
import { SocketService } from 'src/app/services/socket.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { HTMLPost } from '../html-post/html-post.component';
import Converters from 'src/app/utils/converters';
import Upvote from 'src/app/models/upvote';

@Component({
  selector: 'app-buckets-modal',
  templateUrl: './buckets-modal.component.html',
  styleUrls: ['./buckets-modal.component.scss'],
})
export class BucketsModalComponent implements OnInit, OnDestroy {
  board: Board;
  user: User;

  buckets: any;
  activeBucket: any;

  posts: HTMLPost[];

  loading = true;

  movePostActivated: boolean;

  Yoffset: number;
  Xoffset: number;

  constructor(
    public dialogRef: MatDialogRef<BucketsModalComponent>,
    public canvasService: CanvasService,
    public bucketService: BucketService,
    public postService: PostService,
    public socketService: SocketService,
    public dialog: MatDialog,
    protected fabricUtils: FabricUtils,
    private converters: Converters,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.board = data.board;
    this.user = data.user;
    this.Xoffset = data.centerX;
    this.Yoffset = data.centerY;
  }

  ngOnInit(): void {
    this.fetchBuckets();
    this.initGroupEventsListener();
  }

  initGroupEventsListener() {
    // TODO: Be able to listen to specific buckets, else this will add new posts
    // to whichever bucket the client's viewing. Create BUCKET events.
    // this.socketService.listen(SocketEvent.POST_CREATE, async (post: Post) => {
    //   this.posts.push(await this.converters.toHTMLPost(post));
    // });
    this.socketService.listen(SocketEvent.POST_UPDATE, (post: Post) => {
      const found = this.posts.find((p) => p.post.postID == post.postID);
      if (found) found.post = post;
    });
    this.socketService.listen(SocketEvent.POST_DELETE, (id: string) => {
      const found = this.posts.find((p) => p.post.postID == id);
      if (found) {
        this.posts = this.posts.filter((post) => post.post.postID != id);
      }
    });
    this.socketService.listen(SocketEvent.POST_UPVOTE_ADD, (result: any) => {
      const found = this.posts.find(
        (p) => p.post.postID == result.upvote.postID
      );
      if (found) found.upvotes.push(result.upvote);
    });
    this.socketService.listen(SocketEvent.POST_UPVOTE_REMOVE, (result: any) => {
      const found = this.posts.find(
        (p) => p.post.postID == result.upvote.postID
      );
      if (found)
        found.upvotes = found.upvotes.filter(
          (upvote) => upvote.upvoteID != result.upvote.upvoteID
        );
    });
    this.socketService.listen(SocketEvent.POST_COMMENT_ADD, (result: any) => {
      const found = this.posts.find(
        (p) => p.post.postID == result.comment.postID
      );
      if (found) found.comments += 1;
    });
    this.socketService.listen(
      SocketEvent.POST_COMMENT_REMOVE,
      (result: any) => {
        const found = this.posts.find(
          (p) => p.post.postID == result.comment.postID
        );
        if (found) found.comments -= 1;
      }
    );
    this.socketService.listen(SocketEvent.POST_TAG_ADD, ({ post, tag }) => {
      const found = this.posts.find((p) => p.post.postID == post.postID);
      if (found) {
        found.post = post;
      }
    });
    this.socketService.listen(SocketEvent.POST_TAG_REMOVE, ({ post, _tag }) => {
      const found = this.posts.find((p) => p.post.postID == post.postID);
      if (found) {
        found.post = post;
      }
    });
    this.socketService.listen(
      SocketEvent.WORKFLOW_RUN_DISTRIBUTION,
      (ids: string[]) => {
        ids.forEach((id) => {
          const found = this.posts.find((p) => p.post.postID == id);
          if (found) {
            this.posts = this.posts.filter((post) => post.post.postID != id);
          }
        });
      }
    );
    this.socketService.listen(SocketEvent.VOTES_CLEAR, (result: Upvote[]) => {
      const resetedPosts: string[] = [];
      for (const upvotes of result) {
        if (!resetedPosts.includes(upvotes.postID)) {
          const found = this.posts.find((p) => p.post.postID == upvotes.postID);
          if (found) {
            found.upvotes = [];
            resetedPosts.push(upvotes.postID);
          }
        }
      }
    });
  }

  fetchBuckets() {
    this.bucketService.getAllByBoard(this.board.boardID).then((buckets) => {
      this.buckets = buckets;
      if (buckets.length > 0) {
        this.activeBucket = this.buckets[0];
        this.loadBucketPosts(this.activeBucket);
      } else {
        this.loading = false;
      }
    });
  }

  loadBucketPosts(bucket) {
    this.loading = true;
    this.bucketService
      .get(bucket.bucketID)
      .then(async (bucket) => {
        if (bucket) {
          this.activeBucket = bucket;
          this.posts = await this.converters.toHTMLPosts(bucket.posts);
        } else {
          this.posts = [];
        }
        this.loading = false;
      })
      .catch((_err) => {
        this.posts = [];
        this.loading = false;
      });
  }

  ngOnDestroy(): void {
    this.activeBucket = null;
    this.buckets = [];
    this.posts = [];
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
      onComplete: async (post: Post) => {
        const htmlPost = await this.converters.toHTMLPost(post);
        this.posts.push(htmlPost);
      },
    };
    this.dialog.open(AddPostComponent, {
      width: '500px',
      data: dialogData,
    });
  }

  async movePostToBoard(postID: string) {
    const htmlPost = this.posts.find((p) => p.post.postID == postID);

    if (!htmlPost) return;

    const containsAttentionTag = htmlPost.post.tags.find(
      (tag) => tag.name == NEEDS_ATTENTION_TAG.name
    );

    const renderAttr: DisplayAttributes = {
      position: {
        left: this.Xoffset,
        top: this.Yoffset,
      },
      lock: !this.board.permissions.allowStudentMoveAny,
      borderColor: containsAttentionTag ? NEEDS_ATTENTION_TAG.color : undefined,
      borderWidth: containsAttentionTag
        ? POST_TAGGED_BORDER_THICKNESS
        : undefined,
    };

    const post: Post = {
      postID: postID,
      userID: this.user.userID,
      boardID: this.board.boardID,
      type: PostType.BOARD,
      questionAuthoringType: this.board.questionAuthoringType,
      title: htmlPost.post.title,
      author: this.user.username,
      desc: htmlPost.post.desc,
      tags: htmlPost.post.tags ?? [],
      displayAttributes: renderAttr,
    };

    await this.canvasService.createBoardPostFromBucket(post);
    htmlPost.bucketOnly = false;

    this.Yoffset += 50;
  }
}
