import { Server as HttpServer } from 'http'; // Renamed to avoid conflict with socket.io Server
import alinameSocketIO, { Server as SocketIOServer, Socket as SocketIOSocket } from 'socket.io'; // Use aliased names
import { SocketEvent } from '../constants';
import events from './events'; // This should be an array of your event handler objects/classes
import SocketManager from './socketManager';
import RedisClient from '../utils/redis';
import { createAdapter } from '@socket.io/redis-adapter';
import dotenv from 'dotenv';

dotenv.config();

// Define a more specific type for your event handlers if possible
// This helps ensure consistency and better type inference.
interface IEventHandler {
  type: SocketEvent;
  // Using 'any' here for generality, but specific types for P (payload) and R (result) are better.
  // P is the type of data received in the socket event.
  // R is the type of data returned by handleEvent and passed to handleResult.
  handleEvent: (data: any) // Consider SocketPayload<P>
  => Promise<any>; // Consider Promise<R>
  handleResult: (io: SocketIOServer, socket: SocketIOSocket, result: any) // Consider result: R
  => Promise<void>;
}


class Socket {
  private static _instance: Socket;
  private _socketManager: SocketManager;
  private _io: SocketIOServer | null = null;

  private constructor() {
    this._socketManager = SocketManager.Instance;
  }

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  async init(server: HttpServer, redis: RedisClient) {
    try {
      const io = new alinameSocketIO.Server(server, {
        transports: ['websocket', 'polling'],
        cors: {
          origin: process.env.CKBOARD_SERVER_ADDRESS || 'http://localhost:4200',
          methods: ['GET', 'POST'],
        },
        adapter: createAdapter(
          RedisClient.getPublisher(),
          RedisClient.getSubscriber()
        ),
        pingTimeout: 60000,
        pingInterval: 25000,
      });

      this._io = io;
      console.log('Socket server running on port 8000...'); // Assuming port 8000 or your configured port

      io.on('connection', (socket: SocketIOSocket) => {
        console.log(
          `New connection: Socket ID ${socket.id}, IP: ${socket.handshake.address}`
        );
        console.log('Connection details:', {
          id: socket.id,
          handshake: {
            headers: socket.handshake.headers,
            query: socket.handshake.query,
            auth: socket.handshake.auth,
          },
        });

        this._listenForEvents(io, socket);

        socket.on('join', (user: string, room: string) => {
          console.log(`BACKEND: Socket ${socket.id} attempting to join room: ${room} for user: ${user}`);
          socket.data.room = room;
          this._safeJoin(socket, user, room);
          this._logUserSocketsAndRooms(user);
        });

        socket.on('leave', (user: string, room: string) => {
          socket.leave(room);
          console.log(`Socket ${socket.id} left room ${room}`);
          // Removing all listeners for specific event types on 'leave' might be too broad
          // if the socket is still connected and could join other rooms or emit other events.
          // Standard disconnect handles listener cleanup for that socket.
          // events.map((e) => socket.removeAllListeners(e.type.toString()));
          this._socketManager.removeBySocketId(socket.id);
          this._logUserSocketsAndRooms(user);
        });

        socket.on('disconnect', () => {
          console.warn(`Socket ${socket.id} disconnected.`);
          const rooms = Object.keys(socket.rooms); // socket.rooms is a Set, convert to array if needed
          rooms.forEach((room) => {
            if (room !== socket.id) { // Don't try to leave its own ID room
              socket.leave(room);
            }
          });
          this._socketManager.removeBySocketId(socket.id);
        });

        socket.on('disconnectAll', async (room: string) => {
          io.in(room).emit(SocketEvent.BOARD_CONN_UPDATE);
          io.in(room).disconnectSockets(true);
        });

        socket.on('error', (error: any) => {
          if (error.code === 'ECONNRESET') {
            console.error(
              `Socket ${socket.id} connection reset.`
            );
          } else {
            console.error(`Socket ${socket.id} error:`, error);
          }
        });
      });

      io.engine.on('connection_error', (err: any) => { // Typed err
        console.error('Socket.IO connection error:', {
          code: err.code,
          message: err.message,
          context: err.context,
          request: err.req ? { // Check if err.req exists
            ip: err.req.ip,
            url: err.req.url,
            headers: err.req.headers,
          } : undefined,
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
      console.error('IO not initialized. Cannot emit event.');
      return;
      // throw new Error('IO not initialized. Please invoke init() first.');
    }
    this._io.to(roomId).emit(event, eventData);
  }

  private _listenForEvents(io: SocketIOServer, socket: SocketIOSocket) {
    // Ensure 'events' array contains objects/classes that conform to IEventHandler (or similar)
    // where handleEvent's return type matches handleResult's expected result type.
    console.log(`BACKEND: Attaching listeners for socket ${socket.id}`);
    (events as IEventHandler[]).forEach((eventHandler: IEventHandler) => { // Cast to IEventHandler[] for better typing
      socket.on(eventHandler.type, async (data: any) => {
        console.log(`BACKEND Socket.ts: Socket ${socket.id} received event type: ${eventHandler.type}. Raw Data:`, JSON.stringify(data, null, 2));
        try {
          const result = await eventHandler.handleEvent(data);
          // Now, if there's a type mismatch between what handleEvent returns
          // and what handleResult expects, TypeScript will give a more specific error.
          await eventHandler.handleResult(io, socket, result);
        } catch (error) {
          console.error(`BACKEND Socket.ts: Error handling socket event ${eventHandler.type} for socket ${socket.id}:`, error);
          socket.emit('event_error', { event: eventHandler.type, message: error instanceof Error ? error.message : 'An unknown error occurred' });
        }
      });
    });
  }

  private _safeJoin(socket: SocketIOSocket, user: string, nextRoom: string) {
    // It's generally safe for a socket to join multiple rooms if needed.
    // If a socket should only be in one 'primary' room at a time,
    // you might want to leave previous rooms here.
    // For now, just joining:
    socket.join(nextRoom);
    socket.data.room = nextRoom; // Store current primary room on socket.data
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
      const socketInstance = this._io?.sockets.sockets.get(socketId);
      if (socketInstance) {
        console.log(`\tSocket ID: ${socketId}, Rooms: ${Array.from(socketInstance.rooms).join(', ') || 'None'}`);
      } else {
        console.log(
          `\tSocket ID: ${socketId} is not currently connected.`
        );
      }
    });
    console.log('');
  }
}

export default Socket;
