import { Injectable } from '@angular/core';
import {
  HTMLPost,
  HTMLPostConfig,
} from '../components/html-post/html-post.component';
import Post, { PostType } from '../models/post';
import { BoardService } from '../services/board.service';
import { CommentService } from '../services/comment.service';
import { LikesService } from '../services/likes.service';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root',
})
export default class Converters {
  defaultHTMLPostConfig: HTMLPostConfig = {
    hideAuthorName: false,
    allowMoveToBoard: false,
    allowExpand: true,
  };

  constructor(
    private likeService: LikesService,
    private commentService: CommentService,
    private userService: UserService,
    private boardService: BoardService
  ) {}

  async toHTMLPost(
    post: Post,
    config: HTMLPostConfig = this.defaultHTMLPostConfig
  ): Promise<HTMLPost> {
    const board = await this.boardService.get(post.boardID);
    const author = await this.userService.getOneById(post.userID);
    const likes = await this.likeService.getLikesByPost(post.postID);
    const comments = await this.commentService.getCommentsByPost(post.postID);

    return {
      board: board,
      post: post,
      author: author!.username,
      likes: likes.map((like) => like.likerID),
      comments: comments.length,
      bucketOnly: post.type == PostType.BUCKET,
      config: config,
    };
  }

  async toHTMLPosts(
    posts: Post[],
    config: HTMLPostConfig = this.defaultHTMLPostConfig
  ): Promise<HTMLPost[]> {
    return Promise.all(posts.map((post) => this.toHTMLPost(post, config)));
  }
}
