import mongoose from "mongoose";
import { BucketModel } from "../models/Bucket";
import Post, { PostModel } from "../models/Post";
import dalBucket from "./dalBucket";
import dalComment from "./dalComment";
import dalVote from "./dalVote";

export const getById = async (id: string) => {
  try {
    const post = await Post.findOne({ postID: id });
    return post;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const getByBoard = async (boardID: string) => {
  try {
    const posts = await Post.find({ boardID });
    return posts;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const create = async (post: PostModel) => {
  try {
    const savedPost = await Post.create(post);
    return savedPost;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const remove = async (id: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await Post.findOneAndDelete({ postID: id });
    await dalVote.removeByPost(id);
    await dalComment.removeByPost(id);
    await deleteFromBuckets(id);
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  } finally {
    await session.endSession();
  }
};

export const update = async (id: string, post: Partial<PostModel>) => {
  try {
    const updatedPost = await Post.findOneAndUpdate({ postID: id }, post, {
      new: true,
    });
    return updatedPost;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const createMany = async (posts: PostModel[]) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const savedPosts = await Post.insertMany(posts);
    return savedPosts;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  } finally {
    await session.endSession();
  }
};

const deleteFromBuckets = async (id: string) => {
  const buckets: BucketModel[] = await dalBucket.getByPostId(id);
  for (let i = 0; i < buckets.length; i++) {
    await dalBucket.removePost(buckets[i].bucketID, [id]);
  }
};

const dalPost = {
  getById,
  getByBoard,
  create,
  createMany,
  remove,
  update,
};

export default dalPost;
