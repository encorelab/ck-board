/* eslint-disable @typescript-eslint/no-explicit-any */
import { BeAnObject } from '@typegoose/typegoose/lib/types';
import { Document } from 'mongoose';
import { BucketModel } from '../models/Bucket';
import { PostModel } from '../models/Post';
import { GroupTaskModel } from '../models/GroupTask';
import {
  ContainerType,
  DistributionWorkflowModel,
  TaskWorkflowModel,
  WorkflowModel,
  WorkflowType,
} from '../models/Workflow';
import dalBucket from '../repository/dalBucket';
import dalPost from '../repository/dalPost';
import dalWorkflow from '../repository/dalWorkflow';
import dalGroupTask from '../repository/dalGroupTask';
import { convertBucket, convertPostsFromID } from '../utils/converter';
import {
  isDistribution,
  cloneManyToBoard,
  distribute,
  shuffle,
} from '../utils/workflow.helpers';
import { mongo } from 'mongoose';

export const run = async (
  workflow: Document<any, BeAnObject, any> & WorkflowModel
) => {
  if (isDistribution<DistributionWorkflowModel>(workflow)) {
    runDistributionWorkflow(workflow);
  }
};

export const runDistributionWorkflow = async (
  workflow: DistributionWorkflowModel
) => {
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

  await dalWorkflow.updateDistribution(workflow.workflowID, {
    active: false,
  });
};

export const runTaskWorkflow = async (taskWorkflow: TaskWorkflowModel) => {
  const { source, destinations, assignedGroups } = taskWorkflow;
  let sourcePosts;

  if (source.type == ContainerType.BOARD) {
    sourcePosts = await dalPost.getByBoard(source.id);
    sourcePosts = sourcePosts.map((p) => p.postID); //get ids of all source posts
  } else {
    const bucket: BucketModel | null = await dalBucket.getById(source.id);
    sourcePosts = bucket ? bucket.posts : []; //bucket.posts contains postIds
  }

  const split: string[][] = await distribute(
    shuffle(sourcePosts),
    taskWorkflow.postsPerGroup
  );

  if (assignedGroups.length > 0) {
    for (let i = 0; i < assignedGroups.length; i++) {
      const assignedGroup = assignedGroups[i];
      const posts = split[i];

      const newID = new mongo.ObjectId();
      let groupTask = new GroupTaskModel();
      // groupTask._id = newID;
      groupTask.groupTaskID = newID.toString();
      groupTask.groupID = assignedGroup.groupID;
      groupTask.workflowID = taskWorkflow.workflowID;
      groupTask.posts = [];

      for (let j = 0; j < posts.length; j++) {
        groupTask.posts.push({ postID: posts[j], complete: false });
      }
      dalGroupTask.create(groupTask);
      assignedGroup.groupTasks.push(groupTask.groupTaskID);
    }
  }

  // Is assigning to destination still necessary?

  // for (let i = 0; i < destinations.length; i++) {
  //   const destination = destinations[i];
  //   const posts = split[i];

  //   if (destination.type == ContainerType.BOARD) {
  //     const originals: PostModel[] = await convertPostsFromID(posts);
  //     const copied: PostModel[] = cloneManyToBoard(destination.id, originals);
  //     await dalPost.createMany(copied);
  //   } else {
  //     await dalBucket.addPost(destination.id, posts);
  //   }
  // }

  await dalWorkflow.updateDistribution(taskWorkflow.workflowID, {
    active: false,
  });
};

const workflowAgent = {
  run,
  runDistributionWorkflow,
};

export default workflowAgent;
