import { Server, Socket } from 'socket.io';
import { SocketEvent } from '../../constants';
import { BoardModel } from '../../models/Board';
import { UpvoteModel } from '../../models/Upvote';
import { PostModel } from '../../models/Post';
import boardTrace from '../trace/board.trace';
import { SocketPayload } from '../types/event.types';

class BoardNameUpdate {
  static type: SocketEvent = SocketEvent.BOARD_NAME_UDPATE;

  static async handleEvent(
    input: SocketPayload<BoardModel>
  ): Promise<BoardModel> {
    return input.eventData;
  }

  static async handleResult(io: Server, socket: Socket, result: BoardModel) {
    io.to(socket.data.room).emit(this.type, result);
  }
}

class BoardPermissionsUpdate {
  static type: SocketEvent = SocketEvent.BOARD_PERMISSIONS_UPDATE;

  static async handleEvent(
    input: SocketPayload<BoardModel>
  ): Promise<BoardModel> {
    return input.eventData;
  }

  static async handleResult(io: Server, socket: Socket, result: BoardModel) {
    io.to(socket.data.room).emit(this.type, result);
  }
}

class BoardImageUpdate {
  static type: SocketEvent = SocketEvent.BOARD_IMAGE_UPDATE;

  static async handleEvent(
    input: SocketPayload<BoardModel>
  ): Promise<BoardModel> {
    return input.eventData;
  }

  static async handleResult(io: Server, socket: Socket, result: BoardModel) {
    io.to(socket.data.room).emit(this.type, result);
  }
}

class BoardTaskUpdate {
  static type: SocketEvent = SocketEvent.BOARD_TASK_UPDATE;

  static async handleEvent(
    input: SocketPayload<BoardModel>
  ): Promise<BoardModel> {
    return input.eventData;
  }

  static async handleResult(io: Server, socket: Socket, result: BoardModel) {
    io.to(socket.data.room).emit(this.type, result);
  }
}

class BoardTagsUpdate {
  static type: SocketEvent = SocketEvent.BOARD_TAGS_UPDATE;

  static async handleEvent(
    input: SocketPayload<BoardModel>
  ): Promise<BoardModel> {
    return input.eventData;
  }

  static async handleResult(io: Server, socket: Socket, result: BoardModel) {
    io.to(socket.data.room).emit(this.type, result);
  }
}

class BoardUpvoteUpdate {
  static type: SocketEvent = SocketEvent.BOARD_UPVOTE_UPDATE;

  static async handleEvent(
    input: SocketPayload<BoardModel>
  ): Promise<BoardModel> {
    return input.eventData;
  }

  static async handleResult(io: Server, socket: Socket, result: BoardModel) {
    io.to(socket.data.room).emit(this.type, result);
  }
}

class BoardUpvotesClear {
  static type: SocketEvent = SocketEvent.VOTES_CLEAR;

  static async handleEvent(input: SocketPayload<UpvoteModel[]>) {
    if (input.trace.allowTracing) boardTrace.clearVotes(input, this.type);
    return input.eventData;
  }

  static async handleResult(io: Server, socket: Socket, result: string) {
    io.to(socket.data.room).emit(this.type, result);
  }
}

class BoardEnableTracing {
  static type: SocketEvent = SocketEvent.TRACING_ENABLED;
  /**
   *
   * @param input eventData = permissions.allowTracing
   * @returns
   */
  static async handleEvent(input: SocketPayload<boolean>): Promise<boolean> {
    await boardTrace.tracingEnabled(input, this.type); // always need to trace this
    return input.eventData;
  }

  static async handleResult(io: Server, socket: Socket, result: BoardModel) {
    io.to(socket.data.room).emit(this.type, result);
  }
}

class BoardDisableTracing {
  static type: SocketEvent = SocketEvent.TRACING_DISABLED;
  /**
   *
   * @param input eventData = permissions.allowTracing
   * @returns
   */
  static async handleEvent(input: SocketPayload<boolean>): Promise<boolean> {
    await boardTrace.tracingDisabled(input, this.type); // always need to trace this
    return input.eventData;
  }

  static async handleResult(io: Server, socket: Socket, result: BoardModel) {
    io.to(socket.data.room).emit(this.type, result);
  }
}

class BoardClear {
  static type: SocketEvent = SocketEvent.BOARD_CLEAR;

  static async handleEvent(
    input: SocketPayload<PostModel[]>
  ): Promise<string[]> {
    if (input.trace.allowTracing) await boardTrace.clearBoard(input, this.type);
    return input.eventData.map(({ postID }) => postID);
  }

  static async handleResult(io: Server, socket: Socket, result: string[]) {
    io.to(socket.data.room).emit(this.type, result);
  }
}

const boardEvents = [
  BoardNameUpdate,
  BoardPermissionsUpdate,
  BoardImageUpdate,
  BoardTaskUpdate,
  BoardTagsUpdate,
  BoardUpvoteUpdate,
  BoardUpvotesClear,
  BoardEnableTracing,
  BoardDisableTracing,
  BoardClear,
];

export default boardEvents;
