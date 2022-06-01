import { Server, Socket } from "socket.io";
import { SocketEvent } from "../../constants";
import { BucketModel } from "../../models/Bucket";
import { CommentModel } from "../../models/Comment";
import { LikeModel } from "../../models/Like";
import { PostModel } from "../../models/Post";
import { TagModel } from "../../models/Tag";
import dalBucket from "../../repository/dalBucket";
import dalComment from "../../repository/dalComment";
import dalLike from "../../repository/dalLike";
import dalPost from "../../repository/dalPost";
import dalTrace from "../../repository/dalTrace";
import { PostCreatedTrace } from "../trace/post.trace";
import { SocketPayload } from "./types/event.types";

type PostTagEventInput = {
  post: PostModel;
  tag: TagModel;
};

class PostCreate {
  static type: SocketEvent = SocketEvent.POST_CREATE;

  static async handleEvent(
    input: SocketPayload<PostModel>
  ): Promise<PostModel> {
    return input.eventData;
  }

  static async handleResult(io: Server, socket: Socket, result: PostModel) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

class PostUpdate {
  static type: SocketEvent = SocketEvent.POST_UPDATE;

  static async handleEvent(
    input: SocketPayload<Partial<PostModel> & Pick<PostModel, "postID">>
  ): Promise<PostModel | null> {
    const post = await dalPost.update(input.eventData.postID, input.eventData);
    return post;
  }

  static async handleResult(io: Server, socket: Socket, result: PostModel) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

class PostDelete {
  static type: SocketEvent = SocketEvent.POST_DELETE;

  static async handleEvent(input: SocketPayload<PostModel>): Promise<string> {
    const postID = input.eventData.postID;

    await dalPost.remove(postID);

    const buckets: BucketModel[] = await dalBucket.getByPostId(postID);
    for (let i = 0; i < buckets.length; i++) {
      await dalBucket.removePost(buckets[i].bucketID, [postID]);
    }

    return input.eventData.postID;
  }

  static async handleResult(io: Server, socket: Socket, result: string) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

class PostStartMove {
  static type: SocketEvent = SocketEvent.POST_START_MOVE;

  static async handleEvent(
    input: SocketPayload<PostModel>
  ): Promise<PostModel | null> {
    const post = await dalPost.update(input.eventData.postID, input.eventData);
    return post;
  }

  static async handleResult(io: Server, socket: Socket, result: PostModel) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

class PostStopMove {
  static type: SocketEvent = SocketEvent.POST_STOP_MOVE;

  static async handleEvent(
    input: SocketPayload<PostModel>
  ): Promise<PostModel | null> {
    const post = await dalPost.update(input.eventData.postID, input.eventData);
    return post;
  }

  static async handleResult(io: Server, socket: Socket, result: PostModel) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

class PostLikeAdd {
  static type: SocketEvent = SocketEvent.POST_LIKE_ADD;

  static async handleEvent(input: SocketPayload<LikeModel>): Promise<object> {
    const likeAmount = await dalLike.getAmountByPost(input.eventData.postID);

    return { like: input.eventData, amount: likeAmount };
  }

  static async handleResult(io: Server, socket: Socket, result: object) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

class PostLikeRemove {
  static type: SocketEvent = SocketEvent.POST_LIKE_REMOVE;

  static async handleEvent(input: SocketPayload<LikeModel>): Promise<object> {
    const likeAmount = await dalLike.getAmountByPost(input.eventData.postID);

    return { like: input.eventData, amount: likeAmount };
  }

  static async handleResult(io: Server, socket: Socket, result: object) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

class PostCommentAdd {
  static type: SocketEvent = SocketEvent.POST_COMMENT_ADD;

  static async handleEvent(
    input: SocketPayload<CommentModel>
  ): Promise<object> {
    const commentAmount = await dalComment.getAmountByPost(
      input.eventData.postID
    );

    return { comment: input.eventData, amount: commentAmount };
  }

  static async handleResult(io: Server, socket: Socket, result: object) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

class PostTagAdd {
  static type: SocketEvent = SocketEvent.POST_TAG_ADD;

  static async handleEvent(
    input: SocketPayload<PostTagEventInput>
  ): Promise<PostTagEventInput> {
    return input.eventData;
  }

  static async handleResult(
    io: Server,
    socket: Socket,
    result: PostTagEventInput
  ) {
    io.to(socket.data.room).emit(this.type, result);
  }
}

class PostTagRemove {
  static type: SocketEvent = SocketEvent.POST_TAG_REMOVE;

  static async handleEvent(
    input: SocketPayload<PostTagEventInput>
  ): Promise<PostTagEventInput> {
    return input.eventData;
  }

  static async handleResult(
    io: Server,
    socket: Socket,
    result: PostTagEventInput
  ) {
    io.to(socket.data.room).emit(this.type, result);
  }
}

const postEvents = [
  PostCreate,
  PostUpdate,
  PostDelete,
  PostStartMove,
  PostStopMove,
  PostLikeAdd,
  PostLikeRemove,
  PostCommentAdd,
  PostTagAdd,
  PostTagRemove,
];

export default postEvents;
