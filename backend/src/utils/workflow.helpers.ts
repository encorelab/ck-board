import { isDocument } from '@typegoose/typegoose';
import { DocumentType } from '@typegoose/typegoose';
import { KeyStringAny } from '@typegoose/typegoose/lib/types';
import { Document, mongo } from 'mongoose';
import { PostModel, PostType } from '../models/Post';
import {
  Container,
  ContainerType,
  WorkflowModel,
  WorkflowType,
} from '../models/Workflow';
import dalBucket from '../repository/dalBucket';
import dalPost from '../repository/dalPost';
import { convertPostsFromID } from './converter';

export const isDistribution = <T extends WorkflowModel>(
  doc: Document & KeyStringAny
): doc is DocumentType<T> => {
  return doc?.__t === WorkflowType.DISTRIBUTION;
};

export const isTask = <T extends WorkflowModel>(
  doc: Document & KeyStringAny
): doc is DocumentType<T> => {
  return doc?.__t === WorkflowType.TASK;
};

export const shuffle = <T>(array: T[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }

  return array;
};

export const distribute = async <T>(items: T[], n: any): Promise<T[][]> => {
  if (n == 0) return [];

  const split: T[][] = [];
  for (let i = 0; i < items.length; i += n) {
    const chunk = items.slice(i, i + n);
    split.push(chunk);
  }

  return split;
};

export const cloneToBoard = (board: string, post: PostModel) => {
  if (!isDocument(post)) {
    throw new Error('Not a document!');
  }

  const newID = new mongo.ObjectId();
  post._id = newID;
  post.postID = newID.toString();
  post.boardID = board;

  return post;
};

export const cloneManyToBoard = (
  board: string,
  posts: PostModel[]
): PostModel[] => {
  return posts.map((post) => cloneToBoard(board, post));
};

export const movePostsToDestination = async (
  destination: Container,
  posts: string[]
) => {
  if (destination.type != ContainerType.BOARD) {
    await dalBucket.addPost(destination.id, posts);
  }
};

export const removePostFromSource = async (
  source: Container,
  posts: string[]
) => {
  if (source.type == ContainerType.BOARD) {
    for (let i = 0; i < posts.length; i++) {
      await dalPost.update(posts[i], { type: PostType.LIST });
    }
  } else {
    await dalBucket.removePost(source.id, posts);
  }
  return posts;
};

const helpers = [isDistribution, shuffle, distribute];

export default helpers;
