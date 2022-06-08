import mongoose from "mongoose";
import Post, { PostModel } from "../models/Post";

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
  try {
    await Post.findOneAndDelete({ postID: id });
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
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

const dalPost = {
  getById,
  getByBoard,
  create,
  createMany,
  remove,
  update,
};

export default dalPost;
