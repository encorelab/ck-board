import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  DistributionWorkflow,
  TaskWorkflow,
  Workflow,
} from '../models/workflow';
import { BucketService } from './bucket.service';
import { PostService } from './post.service';

@Injectable({
  providedIn: 'root',
})
export class WorkflowService {
  constructor(
    public postService: PostService,
    public bucketService: BucketService,
    public http: HttpClient
  ) {}

  getAll(boardID: string): Promise<Workflow[]> {
    return this.http.get<Workflow[]>('workflows/boards/' + boardID).toPromise();
  }

  getDistribution(boardID: string): Promise<Workflow[]> {
    return this.http
      .get<DistributionWorkflow[]>('workflows/distribution/boards/' + boardID)
      .toPromise();
  }

  createDistribution(
    workflow: DistributionWorkflow
  ): Promise<DistributionWorkflow> {
    return this.http
      .post<DistributionWorkflow>('workflows/distribution/', workflow)
      .toPromise();
  }

  updateDistribution(
    workflowID: string,
    workflow: Partial<DistributionWorkflow>
  ) {
    return this.http
      .post<DistributionWorkflow>(
        'workflows/distribution/' + workflowID,
        workflow
      )
      .toPromise();
  }

  removeDistribution(workflowID: string): Promise<any> {
    return this.http.delete('workflows/distribution/' + workflowID).toPromise();
  }

  getTask(boardID: string): Promise<TaskWorkflow[]> {
    return this.http
      .get<TaskWorkflow[]>('workflows/task/boards/' + boardID)
      .toPromise();
  }

  createTask(workflow: TaskWorkflow): Promise<TaskWorkflow> {
    return this.http
      .post<TaskWorkflow>('workflows/task/', workflow)
      .toPromise();
  }

  updateTask(workflowID: string, workflow: Partial<TaskWorkflow>) {
    return this.http
      .post<TaskWorkflow>('workflows/task/' + workflowID, workflow)
      .toPromise();
  }

  removeTask(workflowID: string): Promise<any> {
    return this.http.delete('workflows/task/' + workflowID).toPromise();
  }
}
