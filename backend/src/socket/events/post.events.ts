import { Server, Socket } from 'socket.io';
import {
  POST_COLOR,
  POST_DEFAULT_OPACITY,
  POST_MOVING_FILL,
  POST_MOVING_OPACITY,
  SocketEvent,
} from '../../constants';
import { BucketModel } from '../../models/Bucket';
import { CommentModel } from '../../models/Comment';
import { LikeModel } from '../../models/Like';
import { PostModel } from '../../models/Post';
import dalBucket from '../../repository/dalBucket';
import dalComment from '../../repository/dalComment';
import dalLike from '../../repository/dalLike';
import dalPost from '../../repository/dalPost';
import postTrace from '../trace/post.trace';
import {
  PostStopMoveEventInput,
  PostTagEventInput,
  SocketPayload,
} from '../types/event.types';

class PostCreate {
  static type: SocketEvent = SocketEvent.POST_CREATE;

  static async handleEvent(
    input: SocketPayload<PostModel>
  ): Promise<PostModel> {
    await postTrace.create(input, this.type);
    return input.eventData;
  }

  static async handleResult(io: Server, socket: Socket, result: PostModel) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

class PostUpdate {
  static type: SocketEvent = SocketEvent.POST_UPDATE;

  static async handleEvent(
    input: SocketPayload<Partial<PostModel> & Pick<PostModel, 'postID'>>
  ): Promise<PostModel | null> {
    const post = await dalPost.update(input.eventData.postID, input.eventData);
    await postTrace.update(input, this.type);
    return post;
  }

  static async handleResult(io: Server, socket: Socket, result: PostModel) {
    io.to(socket.data.room).emit(this.type, result);
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
    await postTrace.remove(input, this.type);

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
    const post = await dalPost.update(input.eventData.postID, {
      displayAttributes: {
        fillColor: POST_MOVING_FILL,
        opacity: POST_MOVING_OPACITY,
      },
    });
    return post;
  }

  static async handleResult(io: Server, socket: Socket, result: PostModel) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

class PostStopMove {
  static type: SocketEvent = SocketEvent.POST_STOP_MOVE;

  static async handleEvent(
    input: SocketPayload<PostStopMoveEventInput>
  ): Promise<PostModel | null> {
    const post = await dalPost.update(input.eventData.postID, {
      displayAttributes: {
        position: { left: input.eventData.left, top: input.eventData.top },
        fillColor: POST_COLOR,
        opacity: POST_DEFAULT_OPACITY,
      },
    });
    await postTrace.move(input, this.type);
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
    await postTrace.likeAdd(input, this.type);

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
    await postTrace.likeRemove(input, this.type);
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
    await postTrace.commentAdd(input, this.type);

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
    await postTrace.tagAdd(input, this.type);
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
    await postTrace.tagRemove(input, this.type);
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

class PostRead {
  static type: SocketEvent = SocketEvent.POST_READ;

  static async handleEvent(input: SocketPayload<string>): Promise<string> {
    await postTrace.read(input, this.type);
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
  PostRead,
];

export default postEvents;
