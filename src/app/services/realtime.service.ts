import { Injectable } from '@angular/core';
import { BoardService } from './board.service';
import { CommentService } from './comment.service';
import { LikesService } from './likes.service';
import { PostService } from './post.service';

@Injectable({
  providedIn: 'root'
})
export class RealtimeService {

  boardID: string

  constructor(
    public commentService: CommentService, 
    public likesService: LikesService,
    public postsService: PostService, 
    public boardService: BoardService
  ) {}

  observe(boardID: string, handlePost, handleLike, handleComment) {
    this.boardID = boardID
    this._synchPosts(handlePost)
    this._synchLikes(handleLike)
    this._synchComments(handleComment)
  }

  private _synchPosts(handler: Function) {
    this.postsService.observable(this.boardID, handler, handler)
  }

  private _synchLikes(handler: Function) {
    this.likesService.observable(this.boardID, handler, true)
  }

  private _synchComments(handler: Function) {
    this.commentService.observable(this.boardID, handler, true)
  }
}