import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Trace } from '../models/trace';
import { TraceContext } from '../models/traceContext';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class TraceService {
  traceContext: TraceContext;
  constructor(private userService: UserService, private http: HttpClient) {
    this.traceContext = {
      userID: '',
      projectID: '',
      boardID: '',
      clientTimestamp: -1,
    };
  }
  setTraceContext(projectID: string, boardID: string) {
    this.traceContext.boardID = boardID;
    this.traceContext.projectID = projectID;
    this.traceContext.userID = this.userService.user?.userID || '';
    this.traceContext.clientTimestamp = Date.now();
  }
  getTraceContext(): TraceContext {
    return this.traceContext;
  }
  getTraceRecords(projectID: string) {
    return this.http.get<Trace[]>('trace/' + projectID).toPromise();
  }
}
