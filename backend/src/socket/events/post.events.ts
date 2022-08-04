import { Server, Socket } from 'socket.io';
import {
  POST_COLOR,
  POST_DEFAULT_OPACITY,
  POST_MOVING_FILL,
  POST_MOVING_OPACITY,
  SocketEvent,
} from '../../constants';
import { CommentModel } from '../../models/Comment';
import { UpvoteModel } from '../../models/Upvote';
import { PostModel } from '../../models/Post';
import dalComment from '../../repository/dalComment';
import dalPost from '../../repository/dalPost';
import postTrace from '../trace/post.trace';
import {
  PostStopMoveEventInput,
  PostTagEventInput,
  SocketPayload,
} from '../types/event.types';
import dalVote from '../../repository/dalVote';

class PostCreate {
  static type: SocketEvent = SocketEvent.POST_CREATE;

  static async handleEvent(
    input: SocketPayload<PostModel>
  ): Promise<PostModel> {
    if (input.trace.allowTracing) await postTrace.create(input, this.type);
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
    if (input.trace.allowTracing) await postTrace.update(input, this.type);
    return post;
  }

  static async handleResult(io: Server, socket: Socket, result: PostModel) {
    io.to(socket.data.room).emit(this.type, result);
  }
}

class PostDelete {
  static type: SocketEvent = SocketEvent.POST_DELETE;

  static async handleEvent(input: SocketPayload<PostModel>): Promise<string> {
    if (input.trace.allowTracing) await postTrace.remove(input, this.type);
    return input.eventData.postID;
  }

  static async handleResult(io: Server, socket: Socket, result: string) {
    io.to(socket.data.room).emit(this.type, result);
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
    if (input.trace.allowTracing) await postTrace.move(input, this.type);
    return post;
  }

  static async handleResult(io: Server, socket: Socket, result: PostModel) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

class PostUpvoteAdd {
  static type: SocketEvent = SocketEvent.POST_UPVOTE_ADD;

  static async handleEvent(input: SocketPayload<UpvoteModel>): Promise<object> {
    const upvoteAmount = await dalVote.getAmountByPost(input.eventData.postID);
    if (input.trace.allowTracing) await postTrace.upvoteAdd(input, this.type);

    return { upvote: input.eventData, amount: upvoteAmount };
  }

  static async handleResult(io: Server, socket: Socket, result: object) {
    io.to(socket.data.room).emit(this.type, result);
  }
}

class PostUpvoteRemove {
  static type: SocketEvent = SocketEvent.POST_UPVOTE_REMOVE;

  static async handleEvent(input: SocketPayload<UpvoteModel>): Promise<object> {
    const upvoteAmount = await dalVote.getAmountByPost(input.eventData.postID);
    if (input.trace.allowTracing)
      await postTrace.upvoteRemove(input, this.type);
    return { upvote: input.eventData, amount: upvoteAmount };
  }

  static async handleResult(io: Server, socket: Socket, result: object) {
    io.to(socket.data.room).emit(this.type, result);
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
    if (input.trace.allowTracing) await postTrace.commentAdd(input, this.type);

    return { comment: input.eventData, amount: commentAmount };
  }

  static async handleResult(io: Server, socket: Socket, result: object) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

class PostCommentRemove {
  static type: SocketEvent = SocketEvent.POST_COMMENT_REMOVE;

  static async handleEvent(
    input: SocketPayload<CommentModel>
  ): Promise<object> {
    const commentAmount = await dalComment.getAmountByPost(
      input.eventData.postID
    );
    await postTrace.commentRemove(input, this.type);

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
    if (input.trace.allowTracing) await postTrace.tagAdd(input, this.type);
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
    if (input.trace.allowTracing) await postTrace.tagRemove(input, this.type);
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
    if (input.trace.allowTracing) await postTrace.read(input, this.type);
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
  PostUpvoteAdd,
  PostUpvoteRemove,
  PostCommentAdd,
  PostCommentRemove,
  PostTagAdd,
  PostTagRemove,
  PostRead,
];

export default postEvents;
