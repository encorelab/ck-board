import { Injectable } from '@angular/core';
import Comment from '../models/comment';
import Like from '../models/like';
import { SocketEvent } from '../utils/constants';
import { FabricUtils } from '../utils/FabricUtils';
import { CommentService } from './comment.service';
import { LikesService } from './likes.service';
import { PostService } from './post.service';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root'
})
export class CanvasService {
  constructor(private socketService: SocketService, private postService: PostService,
    private likesService: LikesService, private commentService: CommentService,
    private fabricUtils: FabricUtils) { }

  async like(like: Like) {
    const result = await this.likesService.add(like);

    let existing = this.fabricUtils.getObjectFromId(result.like.postID);
    existing = this.fabricUtils.setLikeCount(existing, result.count);
    this.fabricUtils._canvas.requestRenderAll();

    const fabricObject = this.fabricUtils.toJSON(existing);
    await this.postService.update(result.like.postID, {fabricObject});

    this.socketService.emit(SocketEvent.POST_LIKE_ADD, like);
  }

  async unlike(like: Like) {
    const result = await this.likesService.remove(like.likeID);

    let existing = this.fabricUtils.getObjectFromId(result.like.postID);
    existing = this.fabricUtils.setLikeCount(existing, result.count);
    this.fabricUtils._canvas.requestRenderAll();

    const fabricObject = this.fabricUtils.toJSON(existing);
    await this.postService.update(result.like.postID, {fabricObject});

    this.socketService.emit(SocketEvent.POST_LIKE_REMOVE, like);
  }

  async comment(comment: Comment) {
    const result = await this.commentService.add(comment);

    let existing = this.fabricUtils.getObjectFromId(result.comment.postID);
    existing = this.fabricUtils.setCommentCount(existing, result.count);
    this.fabricUtils._canvas.requestRenderAll();

    const fabricObject = this.fabricUtils.toJSON(existing);
    await this.postService.update(result.comment.postID, {fabricObject});

    this.socketService.emit(SocketEvent.POST_COMMENT_ADD, comment);
  }
}