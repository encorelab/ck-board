import { Server } from 'http';
import * as socketIO from 'socket.io';
import { SocketEvent } from '../constants';
import events from './events';
import SocketManager from './socketManager';
import RedisClient from '../utils/redis';
import { createAdapter } from '@socket.io/redis-adapter';
import dotenv from 'dotenv';

dotenv.config();

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
   * @param server the http server
   * @returns void
   */

  private _initialized = false;

  async init(server: Server, redis: RedisClient) {
    if (this._initialized) {
      console.warn('Socket server already initialized. Skipping...');
      return;
    }
    this._initialized = true;
    try {
      const io = new socketIO.Server(server, {
        transports: ['websocket', 'polling'],
        cors: {
          origin: process.env.CKBOARD_SERVER_ADDRESS || 'http://localhost:4200', // Specific origin or localhost
          methods: ['GET', 'POST'],
        },
        adapter: createAdapter(
          RedisClient.getPublisher(),
          RedisClient.getSubscriber()
        ),
        pingTimeout: 60000, // 60 seconds (adjust as needed)
        pingInterval: 25000, // 25 seconds (adjust as needed)
      });

      this._io = io;

      console.log('Socket server running on port 8000...');

      io.on('connection', (socket) => {
        console.log(
          `New connection: Socket ID ${socket.id}, IP: ${socket.handshake.address}`
        );

        // Log connection details (optional, but useful for debugging)
        console.log('Connection details:', {
          id: socket.id,
          handshake: {
            headers: socket.handshake.headers,
            query: socket.handshake.query,
            auth: socket.handshake.auth, // If using authentication
          },
        });

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
          console.warn(`Socket ${socket.id} disconnected:`);

          // 1. Leave all rooms
          const rooms = socket.rooms;
          rooms.forEach((room) => {
            socket.leave(room);
          });

          // 2. Remove from SocketManager
          this._socketManager.removeBySocketId(socket.id);
        });

        socket.on('disconnectAll', async (room: string) => {
          io.in(room).emit(SocketEvent.BOARD_CONN_UPDATE);
          io.in(room).disconnectSockets(true);
        });

        // Error handling within the connection handler
        socket.on('error', (error: any) => {
          if (error.code === 'ECONNRESET') {
            console.error(
              `Socket ${socket.id} connection reset. Attempting to reconnect...`
            );
          } else {
            console.error(`Socket ${socket.id} error:`, error);
          }
        });
      });

      // Connection error handling for the server
      io.engine.on('connection_error', (err) => {
        console.error('Socket.IO connection error:', {
          code: err.code,
          message: err.message,
          context: err.context,
          request: {
            ip: err.req.ip,
            url: err.req.url,
            headers: err.req.headers,
          },
          stack: err.stack,
        });
      });
    } catch (error) {
      console.error('Error initializing WebSocket server:', error);
    }
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
      socket.on(event.type, async (data: any) => {
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
