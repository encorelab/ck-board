import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  DistributionWorkflow,
  GroupTask,
  GroupTaskEntity,
  GroupTaskType,
  TaskWorkflow,
  Workflow,
} from '../models/workflow';
import { BucketService } from './bucket.service';
import { PostService } from './post.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class WorkflowService {
  constructor(
    public userService: UserService,
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
  ): Promise<DistributionWorkflow> {
    return this.http
      .put<DistributionWorkflow>(
        'workflows/distribution/' + workflowID,
        workflow
      )
      .toPromise();
  }

  removeDistribution(workflowID: string): Promise<DistributionWorkflow> {
    return this.http
      .delete<DistributionWorkflow>('workflows/distribution/' + workflowID)
      .toPromise();
  }

  runDistribution(workflowID: string): Promise<any> {
    return this.http
      .post<any>('workflows/distribution/' + workflowID, {})
      .toPromise();
  }

  getTask(boardID: string): Promise<TaskWorkflow[]> {
    return this.http
      .get<TaskWorkflow[]>('workflows/task/boards/' + boardID + '?active=false')
      .toPromise();
  }

  getActiveTasks(boardID: string): Promise<TaskWorkflow[]> {
    return this.http
      .get<TaskWorkflow[]>('workflows/task/boards/' + boardID + '?active=true')
      .toPromise();
  }

  createTask(workflow: TaskWorkflow): Promise<TaskWorkflow> {
    return this.http
      .post<TaskWorkflow>('workflows/task/', workflow)
      .toPromise();
  }

  updateTask(
    workflowID: string,
    workflow: Partial<TaskWorkflow>
  ): Promise<TaskWorkflow> {
    return this.http
      .put<TaskWorkflow>('workflows/task/' + workflowID, workflow)
      .toPromise();
  }

  removeTask(workflowID: string): Promise<TaskWorkflow> {
    return this.http
      .delete<TaskWorkflow>('workflows/task/' + workflowID)
      .toPromise();
  }

  runTask(workflowID: string): Promise<any> {
    return this.http.post<any>('workflows/task/' + workflowID, {}).toPromise();
  }

  getGroupTaskByWorkflowGroup<T extends GroupTaskEntity>(
    groupID: string,
    workflowID: string,
    representation: T
  ): Promise<GroupTaskType<T>[]> {
    return this.http
      .get<GroupTaskType<T>[]>(
        `workflows/task/${workflowID}/groupTask/group/${groupID}?representation=${representation}`
      )
      .toPromise();
  }

  getGroupTasks<T extends GroupTaskEntity>(
    boardID: string,
    representation: T
  ): Promise<GroupTaskType<T>[]> {
    return this.http
      .get<GroupTaskType<T>[]>(
        `workflows/task/groupTask/board/${boardID}/user/${this.userService.user?.userID}?representation=${representation}`
      )
      .toPromise();
  }

  getGroupTasksByWorkflow<T extends GroupTaskEntity>(
    workflowID: string,
    representation: T
  ): Promise<GroupTaskType<T>[]> {
    return this.http
      .get<GroupTaskType<T>[]>(
        `workflows/task/${workflowID}/groupTask?representation=${representation}`
      )
      .toPromise();
  }

  updateGroupTask(
    groupTaskID: string,
    update: Partial<GroupTask>
  ): Promise<GroupTask> {
    return this.http
      .post<GroupTask>('workflows/task/groupTask/' + groupTaskID, update)
      .toPromise();
  }

  submitPost(groupTaskID: string, post: string): Promise<GroupTask> {
    return this.http
      .post<GroupTask>(`workflows/task/groupTask/${groupTaskID}/submit`, {
        post,
      })
      .toPromise();
  }

  markGroupTaskComplete(groupTaskID: string): Promise<GroupTask> {
    return this.http
      .post<GroupTask>(`workflows/task/groupTask/${groupTaskID}/complete`, {})
      .toPromise();
  }

  markGroupTaskActive(groupTaskID: string): Promise<GroupTask> {
    return this.http
      .post<GroupTask>(`workflows/task/groupTask/${groupTaskID}/active`, {})
      .toPromise();
  }
}
