import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import LearnerModel, { DimensionValue } from '../models/learner';

@Injectable({
  providedIn: 'root',
})
export class LearnerService {
  constructor(private http: HttpClient) {}

  getByProjects(projectIDs: string[]): Promise<LearnerModel[]> {
    return this.http
      .post<LearnerModel[]>('learner/project/many', { projectIDs })
      .toPromise()
      .then((learners) => learners ?? []); // Default to an empty array
  }

  getByBoards(boardIDs: string[]): Promise<LearnerModel[]> {
    return this.http
      .post<LearnerModel[]>('learner/board/many', { boardIDs })
      .toPromise()
      .then((learners) => learners ?? []); // Default to an empty array
  }

  createModel(
    projectID: string,
    boardID: string,
    name: string,
    dimensions: string[],
    data: DimensionValue[]
  ): Promise<LearnerModel> {
    return this.http
      .post<LearnerModel>('learner/', {
        projectID,
        boardID,
        name,
        dimensions,
        data,
      })
      .toPromise()
      .then((learner) => learner ?? ({} as LearnerModel)); // Default to an empty object
  }

  addDimension(modelID: string, dimension: string): Promise<LearnerModel> {
    return this.http
      .post<LearnerModel>(`learner/${modelID}/addDimension`, { dimension })
      .toPromise()
      .then((learner) => learner ?? ({} as LearnerModel)); // Default to an empty object
  }

  removeDimension(modelID: string, dimension: string): Promise<LearnerModel> {
    return this.http
      .post<LearnerModel>(`learner/${modelID}/removeDimension`, { dimension })
      .toPromise()
      .then((learner) => learner ?? ({} as LearnerModel)); // Default to an empty object
  }

  updateData(
    modelID: string,
    studentID: string,
    assessment: string,
    dimensionValues: DimensionValue[]
  ): Promise<LearnerModel> {
    return this.http
      .post<LearnerModel>(`learner/${modelID}/updateData`, {
        studentID,
        assessment,
        dimensionValues,
      })
      .toPromise()
      .then((learner) => learner ?? ({} as LearnerModel)); // Default to an empty object
  }

  updateModel(
    id: string,
    name: string,
    dimensions: string[],
    data: DimensionValue[]
  ): Promise<LearnerModel> {
    return this.http
      .post<LearnerModel>(`learner/${id}/update`, {
        name,
        dimensions,
        modelData: data,
      })
      .toPromise()
      .then((learner) => learner ?? ({} as LearnerModel)); // Default to an empty object
  }

  deleteModel(id: string): Promise<LearnerModel> {
    return this.http
      .delete<LearnerModel>(`learner/${id}`)
      .toPromise()
      .then((learner) => learner ?? ({} as LearnerModel)); // Default to an empty object
  }
}
