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

  getGroupTask(
    groupID: string,
    workflowID: string,
    userID: string
  ): Promise<GroupTask> {
    return this.http
      .get<GroupTask>(
        'workflows/task/' +
          workflowID +
          '/groupTask/group/' +
          groupID +
          '/user/' +
          userID
      )
      .toPromise()
      .then((groupTask) => groupTask ?? ({} as GroupTask)); // Default to an empty object
  }

  getGroupTasksByWorkflow(workflowID: string): Promise<GroupTask[]> {
    return this.http
      .get<GroupTask[]>('workflows/' + workflowID + '/task')
      .toPromise()
      .then((groupTasks) => groupTasks ?? []); // Default to an empty array
  }

  getGroupTasksByGroup(groupID: string): Promise<GroupTask[]> {
    return this.http
      .get<GroupTask[]>('groupTasks/group/' + groupID)
      .toPromise()
      .then((groupTasks) => groupTasks ?? []); // Default to an empty array
  }

  async createGroupTask(groupTask: GroupTask): Promise<GroupTask> {
    const result = await this.http
      .post<GroupTask>('groupTasks/', groupTask)
      .toPromise();
    if (!result) throw new Error('Failed to create group task.');
    return result as GroupTask;
  }
}
