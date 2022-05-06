import * as socketIO from 'socket.io';
import events from './events';

class Socket {
  private _currentRoom = '';

  /**
   * Initializes websocket server which will listen for users
   * joining boards and handle all board events.
   * 
   * @returns void
   */
  init() {
    const io = new socketIO.Server(8000, {
      cors: {
        origin: ['http://localhost:4200', 'http://localhost:4201']
      },
    });

    console.log('Socket server running at ' + 8000);

    io.on("connection", (socket) => {
      socket.on("join", (room) => {
        this._safeJoin(socket, room);
        this._listenForEvents(socket);
      });
    });
  }

  /**
   * Setup socket to listen for all events from connected user, 
   * handle them accordingly, then emit resulting event back to all users.
   * 
   * @param socket socket which will act on events
   * @returns void
   */
  private _listenForEvents(socket: socketIO.Socket) {
    events.map(event => socket.on(event.type, (data) => {
      event
      .handleEvent(data)
      .then((result) => socket.to(this._currentRoom).emit(event.type, result));
    }));
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