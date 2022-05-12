import { isDocument, post } from "@typegoose/typegoose";
import { mongo } from "mongoose";
import Post, { PostModel } from "../models/Post";

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
    throw new Error("Not a document!");
  }

  const newID = new mongo.ObjectId();
  post._id = newID;
  post.postID = newID.toString();
  post.boardID = board;

  if (post.fabricObject) {
    const rawObj = JSON.parse(post.fabricObject);
    rawObj.boardID = board;
    rawObj.postID = newID;
    post.fabricObject = JSON.stringify(rawObj);
  }

  return post;
};

export const cloneManyToBoard = (
  board: string,
  posts: PostModel[]
): PostModel[] => {
  return posts.map((post) => cloneToBoard(board, post));
};

const helpers = [shuffle, distribute];

export default helpers;
