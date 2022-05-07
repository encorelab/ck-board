import { SocketEvent } from "../constants";
import { LikeModel } from "../models/Like";
import {PostModel} from "../models/Post";
import dalPost from "../repository/dalPost";
import dalLike from "../repository/dalLike";
import { Server, Socket } from "socket.io";
import { CommentModel } from "../models/Comment";
import dalComment from "../repository/dalComment";

class PostCreate {
  static type: SocketEvent = SocketEvent.POST_CREATE;
  
  static async handleEvent(eventData: PostModel): Promise<PostModel> {
    const post = await dalPost.create(eventData);
    return post;
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
    console.log('to: ' + socket.data.room);
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

  static async handleResult(io: Server, socket: Socket, result: number) {
    socket.to(socket.data.room).emit(this.type, result);
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
  PostCommentAdd
];

export default events;