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

  getByProject(projectID: string): Promise<Board[]> {
    return this.http.get<Board[]>('boards/projects/' + projectID).toPromise();
  }

  getMultiple(ids: string[]): Promise<Board[]> {
    return this.http.post<Board[]>('boards/multiple/', ids).toPromise();
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
}
