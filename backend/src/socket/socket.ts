import * as socketIO from 'socket.io';
import { SocketEvent } from '../constants';
import events from './events';
import SocketManager from './socketManager';
import RedisClient from '../utils/redis';
import { createAdapter } from '@socket.io/redis-adapter';

class Socket {
  private static _instance: Socket;

  private _socketManager: SocketManager;
  private _io: socketIO.Server | null = null;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {
    this._socketManager = SocketManager.Instance;
  }

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  /**
   * Initializes websocket server which will listen for users
   * joining boards and handle all board events.
   *
   * @returns void
   */
  init(redis: RedisClient) {
    const io = new socketIO.Server(8000, {
      cors: {
        origin: ['http://localhost:4200', 'http://localhost:4201', 'http://localhost:8001'],
      },
      adapter: createAdapter(redis.getPublisher, redis.getSubscriber),
    });

    this._io = io;

    console.log('Socket server running at ' + 8000);

    io.on('connection', (socket) => {
      // this._socket = socket;

      socket.on('join', (user: string, room: string) => {
        socket.data.room = room;
        this._safeJoin(socket, user, room);
        this._listenForEvents(io, socket);
        this._logUserSocketsAndRooms(user);
      });

      socket.on('leave', (user: string, room: string) => {
        socket.leave(room);
        console.log(`Socket ${socket.id} left room ${room}`);
        events.map((e) => socket.removeAllListeners(e.type.toString()));

        // Remove the specific socketId for the user from the SocketManager
        this._socketManager.removeBySocketId(socket.id);
        this._logUserSocketsAndRooms(user);
      });

      socket.on('disconnect', () => {
        const rooms = socket.rooms;
        rooms.forEach((room) => {
          socket.leave(room);
          // Potentially update or notify the room of the disconnect
        });
        this._socketManager.removeBySocketId(socket.id);
      });

      socket.on('disconnectAll', async (room: string) => {
        io.in(room).emit(SocketEvent.BOARD_CONN_UPDATE);
        io.in(room).disconnectSockets(true);
      });
    });
  }

  /**
   * Emits an event to a specific room.
   *
   * @param event The type of event being emitted.
   * @param eventData Data associated with the event.
   * @param roomId The ID of the room to which the event should be emitted.
   * @param toSender Indicates whether the event should also be sent to the sender.
   */
  emit(event: SocketEvent, eventData: unknown, roomId: string): void {
    if (!this._io) {
      throw new Error('IO not initialized. Please invoke init() first.');
    }

    this._io.to(roomId).emit(event, eventData);
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
  private _safeJoin(socket: socketIO.Socket, user: string, nextRoom: string) {
    socket.join(nextRoom);
    this._socketManager.add(user, socket.id);
    console.log(`Socket ${socket.id} (userID ${user}) joined room ${nextRoom}`);
  }

  /**
   * Logs the sockets and their corresponding rooms for a given user.
   *
   * @param userId The ID of the user whose sockets and rooms to log.
   */
  private _logUserSocketsAndRooms(userId: string): void {
    const socketIds = this._socketManager.get(userId);
    if (!socketIds) {
      return;
    }

    console.log(`User ${userId} =>`);
    socketIds.forEach((socketId) => {
      const socket = this._io?.sockets.sockets.get(socketId);
      if (socket && socket.data.room) {
        console.log(`\tSocket ID: ${socketId}, Room: ${socket.data.room}`);
      } else {
        console.log(
          `\tSocket ID: ${socketId} is not currently connected or has no room.`
        );
      }
    });
    console.log('');
  }
}

export default Socket;
