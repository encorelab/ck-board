import Post, { PostModel } from "../models/Post";

export const getById = async (id: string) => {
  try {
    const post = await Post.findOne({postID: id});
    return post;
  } catch (err) {
    throw new Error('500');
  }
};

export const getByBoard = async (boardID: string) => {
  try {
    const posts = await Post.find({boardID});
    return posts;
  } catch (err) {
    throw new Error('500');
  }
};

export const create = async (post: PostModel) => {
  try {
    const savedPost = await Post.create(post);
    return savedPost;
  } catch (err) {
    throw new Error('500');
  }
};

export const remove = async (id: string) => {
  try {
    await Post.findOneAndDelete({postID: id});
  } catch (err) {
    throw new Error('500');
  }
};

export const update = async (id: string, post: PostModel) => {
  try {
    const updatedPost = await Post.findByIdAndUpdate(id, post);
    return updatedPost;
  } catch (err) {
    throw new Error('500');
  }
};

const dalPost = {
  getById,
  getByBoard,
  create,
  remove,
  update,
};

export default dalPost;