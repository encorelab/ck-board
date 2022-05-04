import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  constructor(private socket: Socket) { }

  /**
   * Connect to specific board's websocket connection.
   * 
   * @param boardID board's ID
   * @returns void
   */
  connect(boardID: string): void {
    this.socket.emit('join', boardID);
  }

  /**
   * Disconnect from board's websocket connection.
   * 
   * @returns void
   */
  disconnect(): void {
    this.socket.disconnect();
  }
}