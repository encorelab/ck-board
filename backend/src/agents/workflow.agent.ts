/* eslint-disable @typescript-eslint/no-explicit-any */
import { BeAnObject } from '@typegoose/typegoose/lib/types';
import { Document } from 'mongoose';
import { BucketModel } from '../models/Bucket';
import { PostModel } from '../models/Post';
import { GroupTaskModel, GroupTaskStatus } from '../models/GroupTask';
import {
  ContainerType,
  DistributionWorkflowModel,
  TaskActionType,
  TaskWorkflowModel,
  WorkflowModel,
} from '../models/Workflow';
import dalBucket from '../repository/dalBucket';
import dalPost from '../repository/dalPost';
import dalWorkflow from '../repository/dalWorkflow';
import dalGroupTask from '../repository/dalGroupTask';
import { convertPostsFromID } from '../utils/converter';
import {
  isDistribution,
  isTask,
  cloneManyToBoard,
  distribute,
  shuffle,
} from '../utils/workflow.helpers';
import { mongo } from 'mongoose';
import Socket from '../socket/socket';
import { SocketEvent } from '../constants';

class WorkflowManager {

  private static _instance: WorkflowManager;

  private runningWorkflows: WorkflowModel[];

  private constructor() {
    this.runningWorkflows = [];
  }

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  async run(workflow: Document<any, BeAnObject, any> & WorkflowModel) {
    if (isDistribution<DistributionWorkflowModel>(workflow)) {
      this._runDistributionWorkflow(workflow);
    } else if (isTask<TaskWorkflowModel>(workflow)) {
      await this._runTaskWorkflow(workflow);
      this.runningWorkflows.push(workflow);
    }
  }

  async updateTask(userId: string, postId: string, type: TaskActionType, delta: number) {
    const tasks: GroupTaskModel[] = await dalGroupTask.getByUserAndPost(userId, postId);

    const updatedTasks = await Promise.all<any[]>(tasks.flatMap(async task => {
      const workflow = await dalWorkflow.getById(task.workflowID);
      if (!workflow || !isTask<TaskWorkflowModel>(workflow)) return [];

      const action = task.actions.find((a) => a.type === type);
      if (workflow && action && action.amountRequired) {
        const newAmountReq = action.amountRequired + delta;
        const limit = workflow.requiredActions.find((a) => a.type === type);
        if (limit && !(newAmountReq > limit.amountRequired || newAmountReq < 0)) {
          action.amountRequired += delta;
          return task;
        }
      }
      return [];
    }));

    await dalGroupTask.updateMany(updatedTasks);
    
    Socket.Instance.emit(SocketEvent.WORKFLOW_PROGRESS_UPDATE, updatedTasks, true);
  }

  private async _runDistributionWorkflow(workflow: DistributionWorkflowModel) {
    const { source, destinations } = workflow;
    let sourcePosts;

    if (source.type == ContainerType.BOARD) {
      sourcePosts = await dalPost.getByBoard(source.id);
      sourcePosts = sourcePosts.map((p) => p.postID);
    } else {
      const bucket: BucketModel | null = await dalBucket.getById(source.id);
      sourcePosts = bucket ? bucket.posts : [];
    }

    const split: string[][] = await distribute(
      shuffle(sourcePosts),
      workflow.postsPerDestination
    );

    for (let i = 0; i < destinations.length; i++) {
      const destination = destinations[i];
      const posts = split[i];

      if (destination.type == ContainerType.BOARD) {
        const originals: PostModel[] = await convertPostsFromID(posts);
        const copied: PostModel[] = cloneManyToBoard(destination.id, originals);
        await dalPost.createMany(copied);
      } else {
        await dalBucket.addPost(destination.id, posts);
      }
    }

    return await dalWorkflow.updateDistribution(workflow.workflowID, {
      active: false,
    });
  }

  private async _runTaskWorkflow(taskWorkflow: TaskWorkflowModel) {
    const { source, assignedGroups } = taskWorkflow;
    let sourcePosts;
  
    if (source.type == ContainerType.BOARD) {
      sourcePosts = await dalPost.getByBoard(source.id);
      sourcePosts = sourcePosts.map((p) => p.postID);
    } else {
      const bucket: BucketModel | null = await dalBucket.getById(source.id);
      sourcePosts = bucket ? bucket.posts : []; 
    }
  
    const split: string[][] = await distribute(
      shuffle(sourcePosts),
      taskWorkflow.postsPerGroup
    );
  
    if (assignedGroups.length > 0) {
      for (let i = 0; i < assignedGroups.length; i++) {
        const assignedGroup = assignedGroups[i];
        const posts = split[i];
  
        const groupTask: GroupTaskModel = {
          groupTaskID: new mongo.ObjectId().toString(),
          groupID: assignedGroup,
          workflowID: taskWorkflow.workflowID,
          posts: posts,
          actions: taskWorkflow.requiredActions,
          status: GroupTaskStatus.INACTIVE,
        };
  
        await dalGroupTask.create(groupTask);
      }
    }
  }
}

export default WorkflowManager;
