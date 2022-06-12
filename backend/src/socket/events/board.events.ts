import { Server, Socket } from "socket.io";
import { SocketEvent } from "../../constants";
import { BoardModel } from "../../models/Board";

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

const boardEvents = [
  BoardNameUpdate,
  BoardPermissionsUpdate,
  BoardImageUpdate,
  BoardTaskUpdate,
  BoardTagsUpdate,
];

export default boardEvents;
