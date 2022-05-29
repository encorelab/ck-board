import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DistributionWorkflow, Workflow } from '../models/workflow';
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
      .get<Workflow[]>('workflows/distribution/boards/' + boardID)
      .toPromise();
  }

  createDistribution(
    workflow: DistributionWorkflow
  ): Promise<DistributionWorkflow> {
    return this.http
      .post<DistributionWorkflow>('workflows/distribution/', workflow)
      .toPromise();
  }

  updateDistribution(workflowID: string, workflow: Partial<Workflow>) {
    return this.http
      .post<Workflow>('workflows/distribution/' + workflowID, workflow)
      .toPromise();
  }

  removeDistribution(workflowID: string): Promise<any> {
    return this.http.delete('workflows/distribution/' + workflowID).toPromise();
  }
}
