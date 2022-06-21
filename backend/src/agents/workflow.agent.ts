/* eslint-disable @typescript-eslint/no-explicit-any */
import { BeAnObject } from '@typegoose/typegoose/lib/types';
import { Document } from 'mongoose';
import { BucketModel } from '../models/Bucket';
import { PostModel } from '../models/Post';
import {
  ContainerType,
  DistributionWorkflowModel,
  WorkflowModel,
  WorkflowType,
} from '../models/Workflow';
import dalBucket from '../repository/dalBucket';
import dalPost from '../repository/dalPost';
import dalWorkflow from '../repository/dalWorkflow';
import { convertBucket, convertPostsFromID } from '../utils/converter';
import {
  isDistribution,
  cloneManyToBoard,
  distribute,
  shuffle,
} from '../utils/workflow.helpers';

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

  await dalWorkflow.update(WorkflowType.DISTRIBUTION, workflow.workflowID, {
    active: false,
  });
};

const workflowAgent = {
  run,
  runDistributionWorkflow,
};

export default workflowAgent;
