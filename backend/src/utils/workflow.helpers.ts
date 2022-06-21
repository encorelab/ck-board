import { isDocument } from '@typegoose/typegoose';
import { DocumentType } from '@typegoose/typegoose';
import { KeyStringAny } from '@typegoose/typegoose/lib/types';
import { Document, mongo } from 'mongoose';
import { PostModel } from '../models/Post';
import { WorkflowModel, WorkflowType } from '../models/Workflow';

export const isDistribution = <T extends WorkflowModel>(
  doc: Document & KeyStringAny
): doc is DocumentType<T> => {
  return doc?.__t === WorkflowType.DISTRIBUTION;
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

export const distribute = async <T>(items: T[], n: number): Promise<T[][]> => {
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

const helpers = [isDistribution, shuffle, distribute];

export default helpers;
