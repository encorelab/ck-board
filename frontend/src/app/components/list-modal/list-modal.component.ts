import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Board } from 'src/app/models/board';
import Post, { Tag } from 'src/app/models/post';
import { BucketService } from 'src/app/services/bucket.service';
import { PostService } from 'src/app/services/post.service';
import { SocketService } from 'src/app/services/socket.service';
import { SocketEvent } from 'src/app/utils/constants';
import { HTMLPost } from '../html-post/html-post.component';
import Converters from '../../utils/converters';

@Component({
  selector: 'app-list-modal',
  templateUrl: './list-modal.component.html',
  styleUrls: ['./list-modal.component.scss'],
})
export class ListModalComponent implements OnInit, OnDestroy {
  board: Board;

  loading = true;
  loadingMore = false;

  posts: HTMLPost[];
  page = 0;

  activeFilters: Tag[] = [];
  filterOptions: Tag[] = [];
  filteredPosts: any[];
  unsubListeners: Function[] = [];

  constructor(
    public dialogRef: MatDialogRef<ListModalComponent>,
    public bucketService: BucketService,
    public postService: PostService,
    public socketService: SocketService,
    public converters: Converters,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.board = data.board;
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
    this.socketService.listen(SocketEvent.POST_LIKE_ADD, (result: any) => {
      const found = this.posts.find((p) => p.post.postID == result.like.postID);
      if (found) found.likes.push(result.like.likerID);
    });
    this.socketService.listen(SocketEvent.POST_LIKE_REMOVE, (result: any) => {
      const found = this.posts.find((p) => p.post.postID == result.like.postID);
      if (found)
        found.likes = found.likes.filter((like) => like != result.like.likerID);
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

  ngOnDestroy(): void {
    this.posts = [];
  }
}
