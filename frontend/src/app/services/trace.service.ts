import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Board } from '../models/board';
import { Trace } from '../models/trace';
import { TraceContext } from '../models/traceContext';
import { BoardService } from './board.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class TraceService {
  traceContext: TraceContext;
  board: Board;
  constructor(
    private userService: UserService,
    private boardService: BoardService,
    private http: HttpClient
  ) {
    this.traceContext = {
      userID: '',
      projectID: '',
      boardID: '',
      clientTimestamp: -1,
      allowTracing: false,
    };
  }
  async setTraceContext(projectID: string, boardID: string) {
    this.traceContext.boardID = boardID;
    this.traceContext.projectID = projectID;
    this.traceContext.userID = this.userService.user?.userID || '';
    this.traceContext.clientTimestamp = Date.now();
    this.board = await this.boardService.get(boardID);
    this.traceContext.allowTracing =
      this.board.permissions.allowTracing || false;
  }
  getTraceContext(): TraceContext {
    return this.traceContext;
  }
  getTraceRecords(projectID: string) {
    return this.http.get<Trace[]>('trace/' + projectID).toPromise();
  }
}
