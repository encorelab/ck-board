import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import Bucket from '../models/bucket';
import { Group } from '../models/group';
import { SocketEvent } from '../utils/constants';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root',
})
export class GroupService {
  constructor(private http: HttpClient, private socketService: SocketService) {}

  getByProjectUser(projectID: string, userID: string): Promise<Group> {
    return this.http
      .get<Group>('groups/project/' + projectID + '/user/' + userID)
      .toPromise();
  }
}
