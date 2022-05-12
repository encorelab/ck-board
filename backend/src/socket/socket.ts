import * as socketIO from "socket.io";
import { SocketEvent } from "../constants";
import events from "./events";

class Socket {
  private static _instance: Socket;

  private _socket: socketIO.Socket | null = null;
  private _currentRoom = "";

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  /**
   * Initializes websocket server which will listen for users
   * joining boards and handle all board events.
   *
   * @returns void
   */
  init() {
    const io = new socketIO.Server(8000, {
      cors: {
        origin: ["http://localhost:4200", "http://localhost:4201"],
      },
    });

    console.log("Socket server running at " + 8000);

    io.on("connection", (socket) => {
      this._socket = socket;

      socket.on("join", (room) => {
        socket.data.room = room;
        this._safeJoin(socket, room);
        this._listenForEvents(io, socket);
      });
    });
  }

  /**
   * Sends an event to all users connected to socket (except sender).
   *
   * @param event the type of event being emitted
   * @param eventData data associated with event
   * @returns void
   */
  emit(event: SocketEvent, eventData: unknown): void {
    if (this._socket == null) {
      throw new Error("Socket not initialized. Please invoke init() first.");
    }

    this._socket.to(this._currentRoom).emit(event, eventData);
  }

  /**
   * Setup socket to listen for all events from connected user,
   * handle them accordingly, then emit resulting event back to all users.
   *
   * @param io socket server
   * @param socket socket which will act on events
   * @returns void
   */
  private _listenForEvents(io: socketIO.Server, socket: socketIO.Socket) {
    events.map((event) =>
      socket.on(event.type, async (data) => {
        const result = await event.handleEvent(data);
        return await event.handleResult(io, socket, result as never);
      })
    );
  }

  /**
   * Allow user to join new room, while always leaving the previous
   * room they were in (if applicable).
   *
   * @param socket socket which will join/leave room
   * @param nextRoom new room to join
   * @returns void
   */
  private _safeJoin(socket: socketIO.Socket, nextRoom: string) {
    if (this._currentRoom) socket.leave(this._currentRoom);

    socket.join(nextRoom);
    this._currentRoom = nextRoom;
    console.log(`Socket ${socket.id} joined room ${nextRoom}`);
  }
}

export default Socket;
