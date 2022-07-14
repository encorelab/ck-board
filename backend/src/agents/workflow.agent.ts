/* eslint-disable @typescript-eslint/no-explicit-any */
import { BeAnObject } from '@typegoose/typegoose/lib/types';
import { Document } from 'mongoose';
import { BucketModel } from '../models/Bucket';
import { PostModel } from '../models/Post';
import {
  ContainerType,
  DistributionWorkflowModel,
  WorkflowModel,
  DistributionWorkflowType,
} from '../models/Workflow';
import dalBucket from '../repository/dalBucket';
import dalPost from '../repository/dalPost';
import dalWorkflow from '../repository/dalWorkflow';
import dalVote from '../repository/dalVote';
import { convertPostsFromID } from '../utils/converter';
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
  if (
    workflow.distributionWorkflowType.type === DistributionWorkflowType.RANDOM
  ) {
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
  } else if (
    workflow.distributionWorkflowType.type === DistributionWorkflowType.TAG
  ) {
    let sourcePosts: PostModel[] = [];
    const filteredPosts: string[] = [];
    if (source.type == ContainerType.BOARD) {
      sourcePosts = await dalPost.getByBoard(source.id);
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
        bucket.posts.forEach(async (postID) => {
          const post = await dalPost.getById(postID);
          post?.tags.forEach((tag) => {
            if (tag.tagID === workflow.distributionWorkflowType.data.tagID) {
              filteredPosts.push(post?.postID);
            }
          });
        });
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
  } else if (
    workflow.distributionWorkflowType.type === DistributionWorkflowType.UPVOTES
  ) {
    let sourcePosts;
    const filteredPosts: string[] = [];
    if (source.type == ContainerType.BOARD) {
      sourcePosts = await dalPost.getByBoard(source.id);
      sourcePosts = sourcePosts.map((p) => p.postID);
    } else {
      const bucket: BucketModel | null = await dalBucket.getById(source.id);
      sourcePosts = bucket ? bucket.posts : [];
    }
    sourcePosts.forEach(async (post) => {
      const upvotes = await dalVote.getAmountByPost(post);
      if (upvotes >= workflow.distributionWorkflowType.data) {
        filteredPosts.push(post);
      }
    });
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
  }
  await dalWorkflow.updateDistribution(workflow.workflowID, {
    active: false,
  });
};

const workflowAgent = {
  run,
  runDistributionWorkflow,
};

export default workflowAgent;
