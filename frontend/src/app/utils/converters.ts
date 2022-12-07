import { Injectable } from '@angular/core';
import { HTMLPost } from '../components/html-post/html-post.component';
import Post, { PostType } from '../models/post';
import { BoardService } from '../services/board.service';
import { CommentService } from '../services/comment.service';
import { UpvotesService } from '../services/upvotes.service';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root',
})
export default class Converters {
  constructor(
    private upvotesService: UpvotesService,
    private commentService: CommentService,
    private userService: UserService,
    private boardService: BoardService
  ) {}

  async toHTMLPost(post: Post): Promise<HTMLPost> {
    const board = await this.boardService.get(post.boardID);
    const author = await this.userService.getOneById(post.userID);
    const upvotes = await this.upvotesService.getUpvotesByPost(post.postID);
    const comments = await this.commentService.getCommentsByPost(post.postID);

    return {
      board: board,
      post: post,
      author: author!.username,
      upvotes: upvotes,
      comments: comments.length,
      bucketOnly: post.type != PostType.BOARD,
    };
  }

  async toHTMLPosts(posts: Post[]): Promise<HTMLPost[]> {
    return Promise.all(posts.map((post) => this.toHTMLPost(post)));
  }
}
