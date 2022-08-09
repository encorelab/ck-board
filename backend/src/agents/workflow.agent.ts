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
  Container,
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
  removePostFromSource,
} from '../utils/workflow.helpers';

export const run = async (
  workflow: Document<any, BeAnObject, any> & WorkflowModel
) => {
  if (isDistribution<DistributionWorkflowModel>(workflow)) {
    runDistributionWorkflow(workflow);
  }
};

export const randomDistributionWorkflow = async (
  workflow: DistributionWorkflowModel,
  source: Container,
  destinations: Container[],
  removeFromSource: boolean
) => {
  let sourcePosts;
  if (source.type == ContainerType.BOARD) {
    sourcePosts = await dalPost.getBoardTypePosts(source.id);
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
};

export const tagDistributionWorkflow = async (
  workflow: DistributionWorkflowModel,
  source: Container,
  destinations: Container[],
  removeFromSource: boolean
) => {
  let sourcePosts: PostModel[] = [];
  const filteredPosts: string[] = [];
  if (source.type == ContainerType.BOARD) {
    sourcePosts = await dalPost.getBoardTypePosts(source.id);
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
};

export const upvoteDistributionWorkflow = async (
  workflow: DistributionWorkflowModel,
  source: Container,
  destinations: Container[],
  removeFromSource: boolean
) => {
  let sourcePosts;
  const filteredPosts: string[] = [];
  if (source.type == ContainerType.BOARD) {
    sourcePosts = await dalPost.getBoardTypePosts(source.id);
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
};

export const runDistributionWorkflow = async (
  workflow: DistributionWorkflowModel
) => {
  const { source, destinations, removeFromSource } = workflow;
  let posts;
  if (
    workflow.distributionWorkflowType.type === DistributionWorkflowType.RANDOM
  ) {
    posts = randomDistributionWorkflow(
      workflow,
      source,
      destinations,
      removeFromSource
    );
  } else if (
    workflow.distributionWorkflowType.type === DistributionWorkflowType.TAG
  ) {
    posts = tagDistributionWorkflow(
      workflow,
      source,
      destinations,
      removeFromSource
    );
  } else if (
    workflow.distributionWorkflowType.type === DistributionWorkflowType.UPVOTES
  ) {
    posts = upvoteDistributionWorkflow(
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
};

const workflowAgent = {
  run,
  runDistributionWorkflow,
};

export default workflowAgent;
