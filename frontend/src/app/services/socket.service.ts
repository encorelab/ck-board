import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { Observable, Subscription, take, catchError, of } from 'rxjs';
import { SocketPayload } from '../models/socketPayload';
import { SocketEvent } from '../utils/constants';
import { TraceService } from './trace.service';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private retryCount = 0;
  private maxRetries = 10;
  private retryInterval = 5000;

  constructor(private socket: Socket, private traceService: TraceService) {
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      // Do NOT attempt to reconnect here.
      // Instead, display an error message to the user or handle it appropriately.
    });
  }

  /**
   * Connect to specific board's websocket connection.
   *
   * @param boardID board's ID
   * @returns void
   */
  connect(userID: string, boardID: string): void {
    this.socket.emit('join', userID, boardID);

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
    });
  }

  /**
   * Listen and handle specific incoming events.
   *
   * @param event event to listen for
   * @param handler handler function once event is received
   * @returns subscription object to unsubscribe from in the future
   */
  listen(event: SocketEvent, handler: Function): Subscription {
    try {
      const observable = this.socket.fromEvent<any>(event);
      return observable.subscribe((value) => {
        handler(value);
      });
    } catch (error) {
      console.error('Error listening for event:', error);
      // Handle the error appropriately, e.g., by returning an empty observable
      return new Subscription(); // Do nothing
    }
  }

  /**
   * Listen for a specific incoming event once.
   *
   * @param event event to listen for
   * @param handler handler function once event is received
   * @returns subscription object to unsubscribe from in the future
   */
  once(event: SocketEvent, handler: Function): Subscription {
    const observable = this.socket.fromEvent<any>(event).pipe(
      take(1),
      catchError((error: Error) => {
        console.error(`Error handling event ${event}:`, error);
        return of(null); // Return a default value
      })
    );
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
    try {
      const trace = this.traceService.getTraceContext();
      const socketPayload: SocketPayload = {
        trace,
        eventData: value,
      };
      this.socket.emit(event, socketPayload);
    } catch (error: any) {
      console.error('Error emitting event:', error);
    }
  }

  /**
   * Disconnect from board's websocket connection.
   *
   * @returns void
   */
  disconnect(userID: string, boardID: string): void {
    this.socket.emit('leave', userID, boardID);
  }

  disconnectAll(boardID): void {
    this.socket.emit('disconnectAll', boardID);
  }
}
