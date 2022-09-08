import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Project } from '../models/project';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  constructor(private http: HttpClient) {}

  get(projectID: string): Promise<Project> {
    return this.http.get<Project>('projects/' + projectID).toPromise();
  }

  getByUserID(id: string): Promise<Project[]> {
    return this.http.get<Project[]>('projects/users/' + id).toPromise();
  }

  create(project: Project): Promise<Project> {
    return this.http.post<Project>('projects/', project).toPromise();
  }

  update(projectID: string, project: Partial<Project>): Promise<Project> {
    return this.http
      .post<Project>('projects/' + projectID, project)
      .toPromise();
  }

  joinProject(code: string): Promise<Project> {
    return this.http.post<Project>(`projects/join`, { code }).toPromise();
  }

  remove(projectID: string): Promise<Project> {
    return this.http.delete<Project>('projects/' + projectID).toPromise();
  }
}
