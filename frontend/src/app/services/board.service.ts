import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
} from '@angular/fire/firestore';
import { Board } from '../models/board';

@Injectable({
  providedIn: 'root',
})
export class BoardService {
  boardRef: AngularFirestoreCollection<Board>;
  boardPath: string = '/boards';

  constructor(private db: AngularFirestore, private http: HttpClient) {
    this.boardRef = db.collection<Board>(this.boardPath);
  }

  get(boardID: string): Promise<Board> {
    return this.http.get<Board>('boards/' + boardID).toPromise();
  }

  getMultiple(ids: string[]) {
    return this.boardRef.ref
      .where('boardID', 'in', ids)
      .get()
      .then((snapshot) => {
        return snapshot.docs;
      });
  }

  getByJoinCode(code: string) {
    return this.boardRef.ref
      .where('joinCode', '==', code)
      .get()
      .then((snapshot) => snapshot);
  }

  getByUserID(id: string): Promise<Board[]> {
    return this.http.get<Board[]>('boards/users/' + id).toPromise();
  }

  update(boardID: string, board: Partial<Board>): Promise<Board> {
    return this.http.post<Board>('boards/' + boardID, board).toPromise();
  }

  create(board: Board) {
    return this.http.post<Board>('boards/', board).toPromise();
  }
}
