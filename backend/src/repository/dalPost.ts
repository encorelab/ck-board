import mongoose from "mongoose";
import Post, { PostModel } from "../models/Post";

export const getById = async (id: string) => {
  try {
    const post = await Post.findOne({ postID: id });
    return post;
  } catch (err) {
    throw new Error("500");
  }
};

export const getByBoard = async (boardID: string) => {
  try {
    const posts = await Post.find({ boardID });
    return posts;
  } catch (err) {
    throw new Error("500");
  }
};

export const create = async (post: PostModel) => {
  try {
    const savedPost = await Post.create(post);
    return savedPost;
  } catch (err) {
    throw new Error("500");
  }
};

export const remove = async (id: string) => {
  try {
    await Post.findOneAndDelete({ postID: id });
  } catch (err) {
    throw new Error("500");
  }
};

export const update = async (postID: string, post: Partial<PostModel>) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await _updateDisplayAttributes(postID, post);
    const updatedPost = await Post.findOneAndUpdate({ postID }, post, {
      new: true,
    });
    return updatedPost;
  } catch (err) {
    throw new Error("500");
  } finally {
    await session.endSession();
  }
};

export const createMany = async (posts: PostModel[]) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const savedPosts = await Post.insertMany(posts);
    return savedPosts;
  } catch (err) {
    throw new Error("500");
  } finally {
    await session.endSession();
  }
};

const _updateDisplayAttributes = async (
  postID: string,
  post: Partial<PostModel>
) => {
  if (!post.displayAttributes) return;

  const finalAttrs = Object.assign({});

  for (const [key, value] of Object.entries(post.displayAttributes)) {
    finalAttrs["displayAttributes." + key] = value;
  }

  await Post.findOneAndUpdate({ postID }, { $set: finalAttrs });
  delete post.displayAttributes;
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
