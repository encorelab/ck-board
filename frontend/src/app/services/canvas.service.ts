import { Injectable } from '@angular/core';
import { fabric } from 'fabric';
import { Board } from '../models/board';
import Comment from '../models/comment';
import Like from '../models/like';
import { Permissions } from '../models/permissions';
import { Tag } from '../models/post';
import { SocketEvent } from '../utils/constants';
import { FabricUtils } from '../utils/FabricUtils';
import { BoardService } from './board.service';
import { CommentService } from './comment.service';
import { FileUploadService } from './fileUpload.service';
import { LikesService } from './likes.service';
import { PostService } from './post.service';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root'
})
export class CanvasService {
  constructor(
    private socketService: SocketService,
    private fileUploadService: FileUploadService, 
    private postService: PostService,
    private likesService: LikesService, 
    private commentService: CommentService,
    private boardService: BoardService, 
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

  async updateBoardTask(boardID: string, title: string, message?: string): Promise<Board> {
    const task = Object.assign({}, 
      title === null ? null : {title},
      message === null ? null : {message}
    );

    const board: Board = await this.boardService.update(boardID, { task });
    this.socketService.emit(SocketEvent.BOARD_TASK_UPDATE, board);
    
    return board;
  }

  async updateBoardName(boardID: string, name: string): Promise<Board> {
    const board: Board = await this.boardService.update(boardID, { name });
    this.socketService.emit(SocketEvent.BOARD_NAME_UPDATE, board);

    return board;
  }

  async updateBoardImage(boardID: string, file: string | null, settings?: any): Promise<Board> {
    if (file === null) {
      const board: Board = await this.boardService.update(boardID, { bgImage: undefined });
      this.socketService.emit(SocketEvent.BOARD_IMAGE_UPDATE, board);
      return board;
    } else {
      return new Promise<Board>(resolve => {
        fabric.Image.fromURL(file, async (image) => {
          const url = await this.fileUploadService.upload(file);
          const imgSettings = settings ?? this.fabricUtils.createImageSettings(image);

          const board: Board = await this.boardService.update(boardID, {bgImage: {url, imgSettings}});
          this.socketService.emit(SocketEvent.BOARD_IMAGE_UPDATE, board);
    
          resolve(board);
        })
      })
    }
  }

  async updateBoardPermissions(boardID: string, permissions: Permissions): Promise<Board> {
    const board: Board = await this.boardService.update(boardID, { permissions });
    this.socketService.emit(SocketEvent.BOARD_PERMISSIONS_UPDATE, board);

    return board;
  }

  async updateBoardTags(boardID: string, tags: Tag[]): Promise<Board> {
    const board: Board = await this.boardService.update(boardID, { tags });
    this.socketService.emit(SocketEvent.BOARD_TAGS_UPDATE, board);

    return board;
  }
}