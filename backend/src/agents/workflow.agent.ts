/* eslint-disable @typescript-eslint/no-explicit-any */
import { BeAnObject } from '@typegoose/typegoose/lib/types';
import { Document } from 'mongoose';
import { BucketModel } from '../models/Bucket';
import { GroupTaskModel, GroupTaskStatus } from '../models/GroupTask';
import { PostModel, PostType } from '../models/Post';
import {
  ContainerType,
  DistributionWorkflowModel,
  TaskAction,
  TaskActionType,
  TaskWorkflowModel,
  WorkflowModel,
  DistributionWorkflowType,
  Container,
  TaskWorkflowType,
} from '../models/Workflow';
import dalBucket from '../repository/dalBucket';
import dalPost from '../repository/dalPost';
import dalWorkflow from '../repository/dalWorkflow';
import dalGroupTask, { GroupTaskExpanded } from '../repository/dalGroupTask';
import dalVote from '../repository/dalVote';
import { convertPostsFromID } from '../utils/converter';
import {
  isDistribution,
  isTask,
  cloneManyToBoard,
  distribute,
  shuffle,
  removePostFromSource,
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
      this.runDistributionWorkflow(workflow);
    } else if (isTask<TaskWorkflowModel>(workflow)) {
      await this.runTaskWorkflow(workflow);
      this.runningWorkflows.push(workflow);
    }
  }

  async runDistributionWorkflow(workflow: DistributionWorkflowModel) {
    const { source, destinations, removeFromSource } = workflow;
    let posts;
    if (
      workflow.distributionWorkflowType.type === DistributionWorkflowType.RANDOM
    ) {
      posts = this.randomDistributionWorkflow(
        workflow,
        source,
        destinations,
        removeFromSource
      );
    } else if (
      workflow.distributionWorkflowType.type === DistributionWorkflowType.TAG
    ) {
      posts = this.tagDistributionWorkflow(
        workflow,
        source,
        destinations,
        removeFromSource
      );
    } else if (
      workflow.distributionWorkflowType.type ===
      DistributionWorkflowType.UPVOTES
    ) {
      posts = this.upvoteDistributionWorkflow(
        workflow,
        source,
        destinations,
        removeFromSource
      );
    }

    await dalWorkflow.updateDistribution(workflow.workflowID, {
      active: false,
    });

    return posts;
  }

  async runTaskWorkflow(taskWorkflow: TaskWorkflowModel) {
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
      sourcePosts.length / taskWorkflow.assignedGroups.length
    );

    // if (taskWorkflow?.type === TaskWorkflowType.GENERATION) sourcePosts = [];
    const commentAction = taskWorkflow.requiredActions.find(
      (a) => a.type == TaskActionType.COMMENT
    );
    const tagAction = taskWorkflow.requiredActions.find(
      (a) => a.type == TaskActionType.TAG
    );
    const createPostAction = taskWorkflow.requiredActions.find(
      (a) => a.type == TaskActionType.CREATE_POST
    );

    const actions: TaskAction[] = [];
    if (commentAction)
      actions.push({
        type: TaskActionType.COMMENT,
        amountRequired: commentAction.amountRequired,
      });
    if (tagAction)
      actions.push({
        type: TaskActionType.TAG,
        amountRequired: tagAction.amountRequired,
      });

    if (assignedGroups.length > 0) {
      for (let i = 0; i < assignedGroups.length; i++) {
        const assignedGroup = assignedGroups[i];
        const posts =
          taskWorkflow?.type === TaskWorkflowType.GENERATION
            ? []
            : split[i] ?? [];

        const progress: Map<string, TaskAction[]> = new Map<
          string,
          TaskAction[]
        >();
        posts.forEach((post) => {
          progress.set(post, actions);
        });

        const groupTask: GroupTaskModel = {
          groupTaskID: new mongo.ObjectId().toString(),
          groupID: assignedGroup,
          workflowID: taskWorkflow.workflowID,
          posts: posts,
          progress: progress,
          status: GroupTaskStatus.INACTIVE,
        };

        await dalGroupTask.create(groupTask);
      }
    }
  }

  async tagDistributionWorkflow(
    workflow: DistributionWorkflowModel,
    source: Container,
    destinations: Container[],
    removeFromSource: boolean
  ) {
    let sourcePosts: PostModel[] = [];
    const filteredPosts: string[] = [];
    if (source.type == ContainerType.BOARD) {
      sourcePosts = await dalPost.getByBoard(source.id, PostType.BOARD);
      sourcePosts.forEach((post) => {
        post.tags.forEach((tag) => {
          if (tag.tagID === workflow.distributionWorkflowType.data.tagID) {
            filteredPosts.push(post.postID);
          }
        });
      });
    } else {
      const bucket: BucketModel | null = await dalBucket.getById(source.id);
      if (bucket) {
        for (let i = 0; i < bucket.posts.length; i++) {
          const post = await dalPost.getById(bucket.posts[i]);
          post?.tags.forEach((tag) => {
            if (tag.tagID === workflow.distributionWorkflowType.data.tagID) {
              filteredPosts.push(post?.postID);
            }
          });
        }
      }
    }

    for (let i = 0; i < destinations.length; i++) {
      const destination = destinations[i];
      if (destination.type == ContainerType.BOARD) {
        const originals: PostModel[] = await convertPostsFromID(filteredPosts);
        const copied: PostModel[] = cloneManyToBoard(destination.id, originals);
        await dalPost.createMany(copied);
      } else {
        await dalBucket.addPost(destination.id, filteredPosts);
      }
    }

    if (removeFromSource) {
      return removePostFromSource(source, filteredPosts);
    }
  }

  async upvoteDistributionWorkflow(
    workflow: DistributionWorkflowModel,
    source: Container,
    destinations: Container[],
    removeFromSource: boolean
  ) {
    let sourcePosts;
    const filteredPosts: string[] = [];
    if (source.type == ContainerType.BOARD) {
      sourcePosts = await dalPost.getByBoard(source.id, PostType.BOARD);
      sourcePosts = sourcePosts.map((p) => p.postID);
    } else {
      const bucket: BucketModel | null = await dalBucket.getById(source.id);
      sourcePosts = bucket ? bucket.posts : [];
    }

    for (let i = 0; i < sourcePosts.length; i++) {
      const upvotes = await dalVote.getAmountByPost(sourcePosts[i]);
      if (upvotes >= workflow.distributionWorkflowType.data) {
        filteredPosts.push(sourcePosts[i]);
      }
    }

    for (let i = 0; i < destinations.length; i++) {
      const destination = destinations[i];
      if (destination.type == ContainerType.BOARD) {
        const originals: PostModel[] = await convertPostsFromID(filteredPosts);
        const copied: PostModel[] = cloneManyToBoard(destination.id, originals);
        await dalPost.createMany(copied);
      } else {
        await dalBucket.addPost(destination.id, filteredPosts);
      }
    }

    if (removeFromSource) {
      return removePostFromSource(source, filteredPosts);
    }
  }

  async randomDistributionWorkflow(
    workflow: DistributionWorkflowModel,
    source: Container,
    destinations: Container[],
    removeFromSource: boolean
  ) {
    let sourcePosts;
    if (source.type == ContainerType.BOARD) {
      sourcePosts = await dalPost.getByBoard(source.id, PostType.BOARD);
      sourcePosts = sourcePosts.map((p) => p.postID);
    } else {
      const bucket: BucketModel | null = await dalBucket.getById(source.id);
      sourcePosts = bucket ? bucket.posts : [];
    }
    const split: string[][] = await distribute(
      shuffle(sourcePosts),
      workflow.distributionWorkflowType.data
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

    if (removeFromSource) {
      return removePostFromSource(source, sourcePosts);
    }
  }
}

export default WorkflowManager;
