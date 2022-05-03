import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class CanvasService {
  documents = this.socket.fromEvent<string[]>('documents');

  constructor(private socket: Socket) { }

  ngOnInit() {
    this.documents.subscribe(doc => console.log(doc));
  }

  newDocument() {
    this.socket.emit('addDoc', { id: this.docId(), doc: this.docId() });
  }

  private docId() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < 5; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  }
}