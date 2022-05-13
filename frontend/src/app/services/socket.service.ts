import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable, Subscription } from 'rxjs';
import { SocketEvent } from '../utils/constants';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  constructor(private socket: Socket) {}

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
   * Listen and handle specific incoming events.
   *
   * @param event event to listen for
   * @param handler handler function once event is received
   * @returns subscription object to unsubscribe from in the future
   */
  listen(event: SocketEvent, handler: Function): Subscription {
    const observable = this.socket.fromEvent<any>(event);
    return observable.subscribe((value) => handler(value));
  }

  /**
   * Emits event to users connected to board.
   *
   * @param event event to emit
   * @param value value to emit along with event
   * @returns void
   */
  emit(event: SocketEvent, value: any): void {
    this.socket.emit(event, value);
  }

  /**
   * Disconnect from board's websocket connection.
   *
   * @returns void
   */
  disconnect(boardID: string): void {
    this.socket.emit('leave', boardID);
  }
}
