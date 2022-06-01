import { Injectable } from '@angular/core';
import { Trace } from '../models/trace';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class TraceService {
  trace: Trace;
  constructor(private userService: UserService) {
    this.trace = {
      userID: '',
      projectID: '',
      boardID: '',
      clientTimestamp: -1,
    };
  }
  public setTrace(projectID: string, boardID: string) {
    this.trace.boardID = boardID;
    this.trace.projectID = projectID;
    this.trace.userID = this.userService.user?.userID || '';
    this.trace.clientTimestamp = Date.now();
  }
  public getTrace(): Trace {
    return this.trace;
  }
}
