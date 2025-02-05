import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  DistributionWorkflow,
  GroupTask,
  GroupTaskEntity,
  GroupTaskStatus,
  GroupTaskType,
  TaskWorkflow,
  Workflow,
} from '../models/workflow';
import { BucketService } from './bucket.service';
import { PostService } from './post.service';
import { UserService } from './user.service';
import { SocketService } from './socket.service';
import { SocketEvent } from '../utils/constants';
import { error } from 'console';

@Injectable({
  providedIn: 'root',
})
export class WorkflowService {
  constructor(
    public userService: UserService,
    public postService: PostService,
    public bucketService: BucketService,
    private socketService: SocketService,
    public http: HttpClient
  ) {}

  async getAll(boardID: string): Promise<Workflow[]> {
    const result = await this.http
      .get<Workflow[]>('workflows/boards/' + boardID)
      .toPromise();
    return result ?? [];
  }

  async getDistribution(boardID: string): Promise<Workflow[]> {
    const result = await this.http
      .get<DistributionWorkflow[]>('workflows/distribution/boards/' + boardID)
      .toPromise();
    return result ?? [];
  }

  async createDistribution(
    workflow: DistributionWorkflow
  ): Promise<DistributionWorkflow> {
    const result = await this.http
      .post<DistributionWorkflow>('workflows/distribution/', workflow)
      .toPromise();
    if (!result) throw new Error('Failed to create distribution workflow.');
    return result;
  }

  async updateDistribution(
    workflowID: string,
    workflow: Partial<DistributionWorkflow>
  ): Promise<DistributionWorkflow> {
    const result = await this.http
      .put<DistributionWorkflow>(
        'workflows/distribution/' + workflowID,
        workflow
      )
      .toPromise();
    if (!result) throw new Error('Failed to update distribution workflow.');
    return result;
  }

  async removeDistribution(workflowID: string): Promise<DistributionWorkflow> {
    const result = await this.http
      .delete<DistributionWorkflow>('workflows/distribution/' + workflowID)
      .toPromise();
    if (!result) throw new Error('Failed to remove distribution workflow.');
    return result;
  }

  async runDistribution(workflowID: string): Promise<any> {
    const result = await this.http
      .post<any>('workflows/distribution/' + workflowID, {})
      .toPromise();
    return result ?? {};
  }

  async getTask(boardID: string): Promise<TaskWorkflow[]> {
    const result = await this.http
      .get<TaskWorkflow[]>('workflows/task/boards/' + boardID + '?active=false')
      .toPromise();
    return result ?? [];
  }

  async getActiveTasks(boardID: string): Promise<TaskWorkflow[]> {
    const result = await this.http
      .get<TaskWorkflow[]>('workflows/task/boards/' + boardID + '?active=true')
      .toPromise();
    return result ?? [];
  }

  async createTask(workflow: TaskWorkflow): Promise<TaskWorkflow> {
    const result = await this.http
      .post<TaskWorkflow>('workflows/task/', workflow)
      .toPromise();
    if (!result) throw new Error('Failed to create task workflow.');
    return result;
  }

  async updateTask(
    workflowID: string,
    workflow: Partial<TaskWorkflow>
  ): Promise<TaskWorkflow> {
    const result = await this.http
      .put<TaskWorkflow>('workflows/task/' + workflowID, workflow)
      .toPromise();
    if (!result) throw new Error('Failed to update task workflow.');
    return result;
  }

  async removeTask(workflowID: string): Promise<TaskWorkflow> {
    const result = await this.http
      .delete<TaskWorkflow>('workflows/task/' + workflowID)
      .toPromise();
    if (!result) throw new Error('Failed to remove task workflow.');

    this.socketService.emit(SocketEvent.WORKFLOW_DELETE_TASK, workflowID);
    return result;
  }

  async runTask(workflowID: string): Promise<any> {
    const result = await this.http
      .post<any>('workflows/task/' + workflowID, {})
      .toPromise();
    return result ?? {};
  }

  async getGroupTaskByWorkflowGroup<T extends GroupTaskEntity>(
    groupID: string,
    workflowID: string,
    representation: T
  ): Promise<GroupTaskType<T>[]> {
    const result = await this.http
      .get<GroupTaskType<T>[]>(
        `workflows/task/${workflowID}/groupTask/group/${groupID}?representation=${representation}`
      )
      .toPromise();
    return result ?? [];
  }

  async getGroupTasks<T extends GroupTaskEntity>(
    boardID: string,
    representation: T
  ): Promise<GroupTaskType<T>[]> {
    const result = await this.http
      .get<GroupTaskType<T>[]>(
        `workflows/task/groupTask/board/${boardID}/user/${this.userService.user?.userID}?representation=${representation}`
      )
      .toPromise();
    return result ?? [];
  }

  async getGroupTasksByWorkflow<T extends GroupTaskEntity>(
    workflowID: string,
    representation: T
  ): Promise<GroupTaskType<T>[]> {
    const result = await this.http
      .get<GroupTaskType<T>[]>(
        `workflows/task/${workflowID}/groupTask?representation=${representation}`
      )
      .toPromise();
    return result ?? [];
  }

  async updateGroupTask(
    groupTaskID: string,
    update: Partial<GroupTask>
  ): Promise<GroupTask> {
    const result = await this.http
      .post<GroupTask>('workflows/task/groupTask/' + groupTaskID, update)
      .toPromise();
    if (!result) throw new Error('Failed to update group task.');
    return result;
  }

  async updateTaskProgress(
    workflowID: string,
    groupTaskID: string,
    postID: string,
    delta: number,
    type: string
  ): Promise<GroupTask> {
    const result = await this.http
      .post<GroupTask>(
        `workflows/task/${workflowID}/groupTask/${groupTaskID}`,
        { postID, delta, type }
      )
      .toPromise();
    if (!result) throw new Error('Failed to update task progress.');
    return result;
  }

  async submitPost(groupTaskID: string, post: string): Promise<GroupTask> {
    const result = await this.http
      .post<GroupTask>(`workflows/task/groupTask/${groupTaskID}/submit`, {
        post,
      })
      .toPromise();
    if (!result) throw new Error('Failed to submit post.');
    return result;
  }

  async markGroupTaskComplete(groupTaskID: string): Promise<GroupTask> {
    const result = await this.http
      .post<GroupTask>(`workflows/task/groupTask/${groupTaskID}/status`, {
        status: GroupTaskStatus.COMPLETE,
      })
      .toPromise();
    if (!result) throw new Error('Failed to mark task complete.');
    return result;
  }

  async markGroupTaskActive(groupTaskID: string): Promise<GroupTask> {
    const result = await this.http
      .post<GroupTask>(`workflows/task/groupTask/${groupTaskID}/status`, {
        status: GroupTaskStatus.ACTIVE,
      })
      .toPromise();
    if (!result) throw new Error('Failed to mark task active.');
    return result;
  }
}
