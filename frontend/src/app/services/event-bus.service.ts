import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EventBusService {
  private eventSubject = new Subject<{ event: string; data: any }>();

  // Observable to listen for events
  event$ = this.eventSubject.asObservable();

  // Emit an event
  emit(event: string, data: any) {
    this.eventSubject.next({ event, data });
  }
}
