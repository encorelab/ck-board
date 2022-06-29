import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Board } from 'src/app/models/board';
import User from 'src/app/models/user';
import Post, { PostType, DisplayAttributes } from 'src/app/models/post';
import { CanvasService } from 'src/app/services/canvas.service';
import { BucketService } from 'src/app/services/bucket.service';
import { PostService } from 'src/app/services/post.service';
import { SocketService } from 'src/app/services/socket.service';
import {
  SocketEvent,
  NEEDS_ATTENTION_TAG,
  POST_TAGGED_BORDER_THICKNESS,
} from 'src/app/utils/constants';
import { HTMLPost } from '../html-post/html-post.component';
import Converters from '../../utils/converters';
import { Tag } from 'src/app/models/tag';

@Component({
  selector: 'app-list-modal',
  templateUrl: './list-modal.component.html',
  styleUrls: ['./list-modal.component.scss'],
})
export class ListModalComponent implements OnInit, OnDestroy {
  board: Board;
  user: User;

  loading = true;
  loadingMore = false;

  posts: HTMLPost[];
  page = 0;

  activeFilters: Tag[] = [];
  filterOptions: Tag[] = [];
  filteredPosts: any[];
  unsubListeners: Function[] = [];

  Yoffset: number;
  Xoffset: number;

  constructor(
    public dialogRef: MatDialogRef<ListModalComponent>,
    public bucketService: BucketService,
    public postService: PostService,
    public canvasService: CanvasService,
    public socketService: SocketService,
    public converters: Converters,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.board = data.board;
    this.user = data.user;
    this.Xoffset = data.centerX;
    this.Yoffset = data.centerY;
  }

  ngOnInit(): void {
    this.fetchInitialPosts().then(() => {
      // wait until posts are fetched before filtering and adding listners
      this.filterPosts();
      this.initGroupEventsListener();
    });
  }

  initGroupEventsListener() {
    this.socketService.listen(SocketEvent.POST_CREATE, async (post: Post) => {
      this.posts.push(await this.converters.toHTMLPost(post));
      this.filterPosts();
    });
    this.socketService.listen(SocketEvent.POST_UPDATE, (post: Post) => {
      const found = this.posts.find((p) => p.post.postID == post.postID);
      if (found) found.post = post;
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
    this.socketService.listen(SocketEvent.POST_DELETE, (id: string) => {
      const found = this.posts.find((p) => p.post.postID == id);
      if (found) {
        this.posts = this.posts.filter((post) => post.post.postID != id);
        this.filterPosts();
      }
    });
    this.socketService.listen(SocketEvent.POST_TAG_ADD, ({ post, tag }) => {
      const found = this.posts.find((p) => p.post.postID == post.postID);
      if (found) {
        found.post = post;
        this.filterPosts();
      }
    });
    this.socketService.listen(SocketEvent.POST_TAG_REMOVE, ({ post, _tag }) => {
      const found = this.posts.find((p) => p.post.postID == post.postID);
      if (found) {
        found.post = post;
        this.filterPosts();
      }
    });
  }

  fetchInitialPosts() {
    this.posts = [];
    this.page = 0;
    this.loading = true;
    return this.fetchMorePosts();
  }

  async fetchMorePosts() {
    const opts = { size: 20, page: this.page };

    const data = await this.postService.getAllByBoard(this.board.boardID, opts);
    const htmlPosts = await this.converters.toHTMLPosts(data);

    this.posts = this.posts.concat(htmlPosts);
    this.page += 1;
    this.loading = false;
    this.loadingMore = false;
  }

  onScroll(event: any) {
    if (
      event.target.offsetHeight + event.target.scrollTop >=
      event.target.scrollHeight
    ) {
      this.loadingMore = true;
      this.fetchMorePosts();
    }
  }

  addFilter(filter: Tag) {
    if (!this.activeFilters.includes(filter)) {
      this.activeFilters.push(filter);
      this.filterPosts();
    }
  }

  removeFilter(filter: Tag) {
    if (this.activeFilters.length > 0) {
      this.activeFilters = this.activeFilters.filter((tag) => tag != filter);
      this.filterPosts();
    }
  }

  filterPosts() {
    // update filter options
    this.filterOptions = this.board.tags.filter(
      (tag) => !this.activeFilters.includes(tag)
    );
    if (this.activeFilters.length > 0) {
      // for each post on the board
      // check if the post has every tag in active filters
      this.filteredPosts = this.posts.filter((post) =>
        this.activeFilters.every((filter) =>
          post.post.tags.map((postTag) => postTag.name).includes(filter.name)
        )
      );
    } else {
      this.filteredPosts = this.posts;
    }
  }

  async movePostToBoard(postID: string) {
    const htmlPost = this.posts.find((p) => p.post.postID == postID);
    console.log('h');
    if (!htmlPost) return;

    console.log('fsdh');
    const containsAttentionTag = htmlPost.post.tags.find(
      (tag) => tag.name == NEEDS_ATTENTION_TAG.name
    );

    console.log('fsdfsgdh');
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
    console.log(this.user);

    const post: Post = {
      postID: postID,
      userID: this.user.userID,
      boardID: this.board.boardID,
      type: PostType.BOARD,
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

  ngOnDestroy(): void {
    this.posts = [];
  }
}
