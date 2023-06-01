import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  DistributionWorkflow,
  GroupTask,
  TaskWorkflow,
  Workflow,
} from '../models/workflow';
import { BucketService } from './bucket.service';
import { PostService } from './post.service';

@Injectable({
  providedIn: 'root',
})
export class GroupTaskService {
  constructor(
    public postService: PostService,
    public bucketService: BucketService,
    public http: HttpClient
  ) {}

  getGroupTask(groupID: string, workflowID: string): Promise<GroupTask> {
    return this.http
      .get<GroupTask>(
        'workflows/task/' + workflowID + '/groupTask/group/' + groupID
      )
      .toPromise();
  }

  getGroupTasksByWorkflow(workflowID: string): Promise<GroupTask[]> {
    return this.http
      .get<GroupTask[]>('workflows/' + workflowID + '/task')
      .toPromise();
  }
}
