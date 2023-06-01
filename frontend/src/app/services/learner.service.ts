import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import LearnerModel, { DimensionValue } from '../models/learner';

@Injectable({
  providedIn: 'root',
})
export class LearnerService {
  constructor(private http: HttpClient) {}

  getByBoards(boardIDs: string[]): Promise<LearnerModel[]> {
    return this.http
      .post<LearnerModel[]>('learner/board/many', { boardIDs })
      .toPromise();
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
      .toPromise();
  }

  addDimension(modelID: string, dimension: string): Promise<LearnerModel> {
    return this.http
      .post<LearnerModel>(`learner/${modelID}/addDimension`, { dimension })
      .toPromise();
  }

  removeDimension(modelID: string, dimension: string): Promise<LearnerModel> {
    return this.http
      .post<LearnerModel>(`learner/${modelID}/removeDimension`, { dimension })
      .toPromise();
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
      .toPromise();
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
      .toPromise();
  }

  deleteModel(id: string): Promise<LearnerModel> {
    return this.http.delete<LearnerModel>(`learner/${id}`).toPromise();
  }
}
