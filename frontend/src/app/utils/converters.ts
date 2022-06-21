import { Injectable } from '@angular/core';
import { HTMLPost } from '../components/html-post/html-post.component';
import Post, { PostType } from '../models/post';
import { BoardService } from '../services/board.service';
import { CommentService } from '../services/comment.service';
import { LikesService } from '../services/likes.service';
import { PostService } from '../services/post.service';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root',
})
export default class Converters {
  constructor(
    private postService: PostService,
    private likeService: LikesService,
    private commentService: CommentService,
    private userService: UserService,
    private boardService: BoardService
  ) {}

  async toHTMLPost(post: Post): Promise<HTMLPost> {
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
    };
  }

  async toHTMLPosts(posts: Post[]): Promise<HTMLPost[]> {
    return Promise.all(posts.map((post) => this.toHTMLPost(post)));
  }
}
