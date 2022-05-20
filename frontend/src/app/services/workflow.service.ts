import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import Workflow from '../models/workflow';
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

  get(boardID: string): Promise<Workflow[]> {
    return this.http.get<Workflow[]>('workflows/boards/' + boardID).toPromise();
  }

  create(workflow: Workflow): Promise<Workflow> {
    return this.http.post<Workflow>('workflows/', workflow).toPromise();
  }

  update(workflowID: string, workflow: Partial<Workflow>) {
    return this.http
      .post<Workflow>('workflows/' + workflowID, workflow)
      .toPromise();
  }

  remove(workflowID: string): Promise<any> {
    return this.http.delete('workflows/' + workflowID).toPromise();
  }
}
