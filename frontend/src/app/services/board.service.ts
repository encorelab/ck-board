import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Board } from '../models/board';

@Injectable({
  providedIn: 'root',
})
export class BoardService {
  constructor(private http: HttpClient) {}

  get(boardID: string): Promise<Board> {
    return this.http.get<Board>('boards/' + boardID).toPromise();
  }

  getMultiple(ids: string[]) {
    return this.http.post<Board[]>('boards/multiple/', ids).toPromise();
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

  remove(id: string) {
    return this.http.delete<Board>('boards/' + id).toPromise();
  }

  clear(id: string) {
    return this.http.delete<Board>('boards/clear' + id).toPromise();
  }
}
