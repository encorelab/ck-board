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

  async init(redis: RedisClient) {
    try {
      // Connect Redis clients for the adapter
      await Promise.all([redis.getPublisher.connect(), redis.getSubscriber.connect()]);

      const io = new socketIO.Server(8000, {
        transports: ['websocket', 'polling'], // Ensure WebSocket upgrades are allowed
        cors: {
          origin: process.env.CKBOARD_SERVER_ADDRESS || '*',
          methods: ['GET', 'POST'],
        },
        adapter: createAdapter(redis.getPublisher, redis.getSubscriber),
      });

      this._io = io;
      console.log('Socket server running on port 8000...');

      // Handle socket connections
      io.on('connection', (socket) => this._handleConnection(io, socket));
    } catch (error) {
      console.error('Error initializing WebSocket server:', error);
    }
  }

  /**
   * Handles new socket connections.
   * @param io The WebSocket server instance.
   * @param socket The connected socket.
   */
  private _handleConnection(io: socketIO.Server, socket: socketIO.Socket) {
    console.log(`New connection: Socket ID ${socket.id}`);

    socket.on('join', (user: string, room: string) => {
      socket.data.room = room;
      this._safeJoin(socket, user, room);
      this._listenForEvents(io, socket);
      this._logUserSocketsAndRooms(user);
    });

    socket.on('leave', (user: string, room: string) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room ${room}`);
      events.forEach((e) => socket.removeAllListeners(e.type.toString()));
      this._socketManager.removeBySocketId(socket.id);
      this._logUserSocketsAndRooms(user);
    });

    socket.on('disconnect', () => {
      console.log(`Socket ${socket.id} disconnected`);
      this._cleanupSocket(socket);
    });

    socket.on('disconnectAll', (room: string) => {
      console.log(`Disconnecting all sockets from room: ${room}`);
      io.in(room).emit(SocketEvent.BOARD_CONN_UPDATE);
      io.in(room).disconnectSockets(true);
    });
  }

  /**
   * Emits an event to a specific room.
   */
  emit(event: SocketEvent, eventData: unknown, roomId: string): void {
    if (!this._io) throw new Error('IO not initialized. Please invoke init() first.');
    this._io.to(roomId).emit(event, eventData);
  }

  /**
   * Listens for events on a specific socket.
   */
  private _listenForEvents(io: socketIO.Server, socket: socketIO.Socket) {
    events.forEach((event) =>
      socket.on(event.type, async (data) => {
        try {
          const result = await event.handleEvent(data);
          await event.handleResult(io, socket, result as never);
        } catch (error) {
          console.error(`Error handling event ${event.type}:`, error);
        }
      })
    );
  }

  /**
   * Allows a socket to join a room, ensuring safe management of rooms.
   */
  private _safeJoin(socket: socketIO.Socket, user: string, nextRoom: string) {
    socket.join(nextRoom);
    this._socketManager.add(user, socket.id);
    console.log(`Socket ${socket.id} (User ${user}) joined room ${nextRoom}`);
  }

  /**
   * Logs the current sockets and rooms for a given user.
   */
  private _logUserSocketsAndRooms(userId: string): void {
    const socketIds = this._socketManager.get(userId);
    if (!socketIds) return;

    console.log(`User ${userId} has the following sockets and rooms:`);
    socketIds.forEach((socketId) => {
      const socket = this._io?.sockets.sockets.get(socketId);
      if (socket && socket.data.room) {
        console.log(`\tSocket ID: ${socketId}, Room: ${socket.data.room}`);
      } else {
        console.log(`\tSocket ID: ${socketId} is not connected or has no room.`);
      }
    });
    console.log('');
  }

  /**
   * Cleans up a socket's rooms and listeners on disconnect.
   */
  private _cleanupSocket(socket: socketIO.Socket) {
    socket.rooms.forEach((room) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room ${room}`);
    });
    this._socketManager.removeBySocketId(socket.id);
  }
}

export default Socket;