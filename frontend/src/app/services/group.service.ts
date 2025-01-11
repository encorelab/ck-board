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
      .toPromise()
      .then((group) => group ?? ({} as Group)); // Default to an empty object
  }

  getById(groupID: string): Promise<Group> {
    return this.http
      .get<Group>('groups/' + groupID)
      .toPromise()
      .then((group) => group ?? ({} as Group)); // Default to an empty object
  }

  getByUserId(userID: string): Promise<Group[]> {
    return this.http
      .get<Group[]>('groups/user/' + userID)
      .toPromise()
      .then((groups) => groups ?? []); // Default to an empty array
  }

  getByUserAndProject(userID: string, projectID: string): Promise<Group[]> {
    return this.http
      .get<Group[]>(`groups/user/${userID}/project/${projectID}`)
      .toPromise()
      .then((groups) => groups ?? []); // Default to an empty array
  }

  getByProjectId(projectID: string): Promise<Group[]> {
    return this.http
      .get<Group[]>('groups/project/' + projectID)
      .toPromise()
      .then((groups) => groups ?? []); // Default to an empty array
  }

  async getMultipleBy(groupIDs: string[]): Promise<Group[]> {
    try {
      const groups = await this.http.post<Group[]>('groups/multiple', { groupIDs }).toPromise();
      return groups ?? []; // Default to an empty array if null or undefined
    } catch (error) {
      console.error("Error fetching multiple groups:", error);
      return []; // Return an empty array in case of an error
    }
  }

  create(group: Group): Promise<Group> {
    return this.http
      .post<Group>('groups/', group)
      .toPromise()
      .then((createdGroup) => createdGroup ?? ({} as Group)); // Default to an empty object
  }

  delete(groupID: string): Promise<Group> {
    return this.http
      .delete<Group>('groups/' + groupID)
      .toPromise()
      .then((deletedGroup) => deletedGroup ?? ({} as Group)); // Default to an empty object
  }

  update(groupID: string, group: Partial<Group>): Promise<Group> {
    return this.http
      .post<Group>('groups/' + groupID, group)
      .toPromise()
      .then((updatedGroup) => updatedGroup ?? ({} as Group)); // Default to an empty object
  }

  addUsers(groupID: string, ...users: string[]): Promise<Group> {
    return this.http
      .post<Group>('groups/' + groupID + '/users/add/', users)
      .toPromise()
      .then((updatedGroup) => updatedGroup ?? ({} as Group)); // Default to an empty object
  }

  removeUsers(groupID: string, ...users: string[]): Promise<Group> {
    return this.http
      .post<Group>('groups/' + groupID + '/users/remove/', users)
      .toPromise()
      .then((updatedGroup) => updatedGroup ?? ({} as Group)); // Default to an empty object
  }
}
