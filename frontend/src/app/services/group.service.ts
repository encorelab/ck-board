import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Group } from '../models/group';
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

  getById(groupID: string): Promise<Group> {
    return this.http.get<Group>('groups/' + groupID).toPromise();
  }

  getByUserId(userID: string): Promise<Group[]> {
    return this.http.get<Group[]>('groups/user/' + userID).toPromise();
  }

  getByProjectId(projectID: string): Promise<Group[]> {
    return this.http.get<Group[]>('groups/project/' + projectID).toPromise();
  }

  create(group: Group): Promise<Group> {
    return this.http.post<Group>('groups/', group).toPromise();
  }

  delete(groupID: string): Promise<Group> {
    return this.http.delete<Group>('groups/' + groupID).toPromise();
  }

  update(groupID: string, group: Partial<Group>): Promise<Group> {
    return this.http.post<Group>('groups/' + groupID, group).toPromise();
  }

  addUsers(groupID: string, ...users: string[]): Promise<Group> {
    return this.http
      .post<Group>('groups/' + groupID + '/users/add/', users)
      .toPromise();
  }

  removeUsers(groupID: string, ...users: string[]): Promise<Group> {
    return this.http
      .post<Group>('groups/' + groupID + '/users/remove/', users)
      .toPromise();
  }
}
