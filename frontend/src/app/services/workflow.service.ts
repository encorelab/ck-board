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
import { lastValueFrom } from 'rxjs'; // Import lastValueFrom

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

  getAll(boardID: string): Promise<Workflow[] | undefined> {
    return lastValueFrom(this.http.get<Workflow[]>(`workflows/boards/${boardID}`));
  }

  getDistribution(boardID: string): Promise<Workflow[] | undefined> {
    return lastValueFrom(this.http.get<DistributionWorkflow[]>(`workflows/distribution/boards/${boardID}`));
  }

  createDistribution(workflow: DistributionWorkflow): Promise<DistributionWorkflow | undefined> {
    return lastValueFrom(this.http.post<DistributionWorkflow>('workflows/distribution/', workflow));
  }

  updateDistribution(workflowID: string, workflow: Partial<DistributionWorkflow>): Promise<DistributionWorkflow | undefined> {
    return lastValueFrom(this.http.put<DistributionWorkflow>(`workflows/distribution/${workflowID}`, workflow));
  }

  removeDistribution(workflowID: string): Promise<DistributionWorkflow | undefined> {
    return lastValueFrom(this.http.delete<DistributionWorkflow>(`workflows/distribution/${workflowID}`));
  }

  runDistribution(workflowID: string): Promise<any> {
    return lastValueFrom(this.http.post<any>(`workflows/distribution/${workflowID}`, {}));
  }

  getTask(boardID: string): Promise<TaskWorkflow[] | undefined> {
    return lastValueFrom(this.http.get<TaskWorkflow[]>(`workflows/task/boards/${boardID}?active=false`));
  }

  getActiveTasks(boardID: string): Promise<TaskWorkflow[] | undefined> {
    return lastValueFrom(this.http.get<TaskWorkflow[]>(`workflows/task/boards/${boardID}?active=true`));
  }

  createTask(workflow: TaskWorkflow): Promise<TaskWorkflow | undefined> {
    return lastValueFrom(this.http.post<TaskWorkflow>('workflows/task/', workflow));
  }

  updateTask(workflowID: string, workflow: Partial<TaskWorkflow>): Promise<TaskWorkflow | undefined> {
    return lastValueFrom(this.http.put<TaskWorkflow>(`workflows/task/${workflowID}`, workflow));
  }

  removeTask(workflowID: string): Promise<TaskWorkflow | undefined> {
    return lastValueFrom(this.http.delete<TaskWorkflow>(`workflows/task/${workflowID}`));
  }

  runTask(workflowID: string): Promise<any> {
    return lastValueFrom(this.http.post<any>(`workflows/task/${workflowID}`, {}));
  }

  getGroupTaskByWorkflowGroup<T extends GroupTaskEntity>(groupID: string, workflowID: string, representation: T): Promise<GroupTaskType<T>[] | undefined> {
    return lastValueFrom(this.http.get<GroupTaskType<T>[]>(`workflows/task/${workflowID}/groupTask/group/${groupID}?representation=${representation}`));
  }

  getGroupTasks<T extends GroupTaskEntity>(boardID: string, representation: T): Promise<GroupTaskType<T>[] | undefined> {
    return lastValueFrom(this.http.get<GroupTaskType<T>[]>(`workflows/task/groupTask/board/${boardID}/user/${this.userService.user?.userID}?representation=${representation}`));
  }

  getGroupTasksByWorkflow<T extends GroupTaskEntity>(workflowID: string, representation: T): Promise<GroupTaskType<T>[] | undefined> {
    return lastValueFrom(this.http.get<GroupTaskType<T>[]>(`workflows/task/${workflowID}/groupTask?representation=${representation}`));
  }

  updateGroupTask(groupTaskID: string, update: Partial<GroupTask>): Promise<GroupTask | undefined> {
    return lastValueFrom(this.http.post<GroupTask>('workflows/task/groupTask/' + groupTaskID, update));
  }

  updateTaskProgress(workflowID: string, groupTaskID: string, postID: string, delta: number, type: string): Promise<GroupTask | undefined> {
    return lastValueFrom(this.http.post<GroupTask>(`workflows/task/${workflowID}/groupTask/${groupTaskID}`, { postID, delta, type }));
  }

  submitPost(groupTaskID: string, post: string): Promise<GroupTask | undefined> {
    return lastValueFrom(this.http.post<GroupTask>(`workflows/task/groupTask/${groupTaskID}/submit`, { post }));
  }

  markGroupTaskComplete(groupTaskID: string): Promise<GroupTask | undefined> {
    return lastValueFrom(this.http.post<GroupTask>(`workflows/task/groupTask/${groupTaskID}/status`, { status: GroupTaskStatus.COMPLETE }));
  }

  markGroupTaskActive(groupTaskID: string): Promise<GroupTask | undefined> {
    return lastValueFrom(this.http.post<GroupTask>(`workflows/task/groupTask/${groupTaskID}/status`, { status: GroupTaskStatus.ACTIVE }));
  }
}

