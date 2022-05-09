import { SocketEvent } from "../constants";
import { LikeModel } from "../models/Like";
import {PostModel} from "../models/Post";
import dalPost from "../repository/dalPost";
import dalLike from "../repository/dalLike";
import { Server, Socket } from "socket.io";
import { CommentModel } from "../models/Comment";
import dalComment from "../repository/dalComment";
import { BoardModel } from "../models/Board";

class PostCreate {
  static type: SocketEvent = SocketEvent.POST_CREATE;
  
  static async handleEvent(eventData: PostModel): Promise<PostModel> {
    return eventData;
  }

  static async handleResult(io: Server, socket: Socket, result: PostModel) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

class PostUpdate {
  static type: SocketEvent = SocketEvent.POST_UPDATE;
  
  static async handleEvent(eventData: Partial<PostModel> & Pick<PostModel, 'postID'>): Promise<PostModel | null> {
    const post = await dalPost.update(eventData.postID, eventData);
    return post;
  }

  static async handleResult(io: Server, socket: Socket, result: PostModel) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

class PostDelete {
  static type: SocketEvent = SocketEvent.POST_DELETE;
  
  static async handleEvent(eventData: PostModel): Promise<string> {
    await dalPost.remove(eventData.postID);
    return eventData.postID;
  }

  static async handleResult(io: Server, socket: Socket, result: string) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

class PostStartMove {
  static type: SocketEvent = SocketEvent.POST_START_MOVE;
  
  static async handleEvent(eventData: PostModel): Promise<PostModel | null> {
    const post = await dalPost.update(eventData.postID, eventData);
    return post;
  }

  static async handleResult(io: Server, socket: Socket, result: PostModel) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

class PostStopMove {
  static type: SocketEvent = SocketEvent.POST_STOP_MOVE;
  
  static async handleEvent(eventData: PostModel): Promise<PostModel | null> {
    const post = await dalPost.update(eventData.postID, eventData);
    return post;
  }

  static async handleResult(io: Server, socket: Socket, result: PostModel) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

class PostLikeAdd {
  static type: SocketEvent = SocketEvent.POST_LIKE_ADD;

  static async handleEvent(eventData: LikeModel): Promise<object> {
    const likeAmount = await dalLike.getAmountByPost(eventData.postID);

    return {like: eventData, amount: likeAmount};
  }

  static async handleResult(io: Server, socket: Socket, result: object) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

class PostLikeRemove {
  static type: SocketEvent = SocketEvent.POST_LIKE_REMOVE;
  
  static async handleEvent(eventData: LikeModel): Promise<object> {
    const likeAmount = await dalLike.getAmountByPost(eventData.postID);
    
    return {like: eventData, amount: likeAmount};
  }

  static async handleResult(io: Server, socket: Socket, result: object) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

class PostCommentAdd {
  static type: SocketEvent = SocketEvent.POST_COMMENT_ADD;
  
  static async handleEvent(eventData: CommentModel): Promise<object> {
    const commentAmount = await dalComment.getAmountByPost(eventData.postID);
    
    return {comment: eventData, amount: commentAmount};
  }

  static async handleResult(io: Server, socket: Socket, result: object) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

class PostNeedsAttentionTag {
  static type: SocketEvent = SocketEvent.POST_NEEDS_ATTENTION_TAG;
  
  static async handleEvent(eventData: PostModel): Promise<PostModel> {
    return eventData;
  }

  static async handleResult(io: Server, socket: Socket, result: PostModel) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

class PostNoTag {
  static type: SocketEvent = SocketEvent.POST_NO_TAG;
  
  static async handleEvent(eventData: PostModel): Promise<PostModel> {
    return eventData;
  }

  static async handleResult(io: Server, socket: Socket, result: PostModel) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

class BoardNameUpdate {
  static type: SocketEvent = SocketEvent.BOARD_NAME_UDPATE;
  
  static async handleEvent(eventData: BoardModel): Promise<BoardModel> {
    return eventData;
  }

  static async handleResult(io: Server, socket: Socket, result: number) {
    io.to(socket.data.room).emit(this.type, result);
  }
}

class BoardPermissionsUpdate {
  static type: SocketEvent = SocketEvent.BOARD_PERMISSIONS_UPDATE;
  
  static async handleEvent(eventData: BoardModel): Promise<BoardModel> {
    return eventData;
  }

  static async handleResult(io: Server, socket: Socket, result: number) {
    io.to(socket.data.room).emit(this.type, result);
  }
}

class BoardImageUpdate {
  static type: SocketEvent = SocketEvent.BOARD_IMAGE_UPDATE;
  
  static async handleEvent(eventData: BoardModel): Promise<BoardModel> {
    return eventData;
  }

  static async handleResult(io: Server, socket: Socket, result: number) {
    io.to(socket.data.room).emit(this.type, result);
  }
}

class BoardTaskUpdate {
  static type: SocketEvent = SocketEvent.BOARD_TASK_UPDATE;
  
  static async handleEvent(eventData: BoardModel): Promise<BoardModel> {
    return eventData;
  }

  static async handleResult(io: Server, socket: Socket, result: number) {
    io.to(socket.data.room).emit(this.type, result);
  }
}

class BoardTagsUpdate {
  static type: SocketEvent = SocketEvent.BOARD_TAGS_UPDATE;
  
  static async handleEvent(eventData: BoardModel): Promise<BoardModel> {
    return eventData;
  }

  static async handleResult(io: Server, socket: Socket, result: number) {
    io.to(socket.data.room).emit(this.type, result);
  }
}

const events = [
  PostCreate, 
  PostUpdate,
  PostDelete,
  PostStartMove,
  PostStopMove,
  PostLikeAdd,
  PostLikeRemove,
  PostCommentAdd,
  PostNeedsAttentionTag,
  PostNoTag,
  BoardNameUpdate,
  BoardPermissionsUpdate,
  BoardImageUpdate,
  BoardTaskUpdate,
  BoardTagsUpdate
];

export default events;