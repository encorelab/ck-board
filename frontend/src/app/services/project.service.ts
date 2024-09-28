import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Project } from '../models/project';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  constructor(private http: HttpClient) {}

  get(projectID: string): Promise<Project> {
    return this.http
      .get<Project>('projects/' + projectID)
      .toPromise()
      .then((project) => project ?? ({} as Project)); // Default to an empty object
  }

  getByUserID(id: string): Promise<Project[]> {
    return this.http
      .get<Project[]>('projects/users/' + id)
      .toPromise()
      .then((projects) => projects ?? []); // Default to an empty array
  }

  create(project: Project): Promise<Project> {
    return this.http
      .post<Project>('projects/', project)
      .toPromise()
      .then((newProject) => newProject ?? ({} as Project)); // Default to an empty object
  }

  update(projectID: string, project: Partial<Project>): Promise<Project> {
    return this.http
      .post<Project>('projects/' + projectID, project)
      .toPromise()
      .then((updatedProject) => updatedProject ?? ({} as Project)); // Default to an empty object
  }

  joinProject(code: string): Promise<Project> {
    return this.http
      .post<Project>(`projects/join`, { code })
      .toPromise()
      .then((joinedProject) => joinedProject ?? ({} as Project)); // Default to an empty object
  }

  remove(projectID: string): Promise<Project> {
    return this.http
      .delete<Project>('projects/' + projectID)
      .toPromise()
      .then((deletedProject) => deletedProject ?? ({} as Project)); // Default to an empty object
  }
}
