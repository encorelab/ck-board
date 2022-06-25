import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable, Subscription } from 'rxjs';
import { SocketPayload } from '../models/socketPayload';
import { SocketEvent } from '../utils/constants';
import { TraceService } from './trace.service';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  constructor(private socket: Socket, private traceService: TraceService) {}

  /**
   * Connect to specific board's websocket connection.
   *
   * @param boardID board's ID
   * @returns void
   */
  connect(userID: string, boardID: string): void {
    this.socket.emit('join', userID, boardID);
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
    const trace = this.traceService.getTraceContext();
    const socketPayload: SocketPayload = {
      trace,
      eventData: value,
    };
    this.socket.emit(event, socketPayload);
  }

  /**
   * Disconnect from board's websocket connection.
   *
   * @returns void
   */
  disconnect(userID: string, boardID: string): void {
    this.socket.emit('leave', userID, boardID);
  }
}
