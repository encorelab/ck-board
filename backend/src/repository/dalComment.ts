import Comment, { CommentModel } from "../models/Comment";

export const getByPost = async (id: string) => {
  try {
    const comments = await Comment.find({postID: id});
    return comments;
  } catch (err) {
    throw new Error('500');
  }
};

export const getAmountByPost = async (id: string) => {
  try {
    const numComments = await Comment.countDocuments({postID: id});
    return numComments;
  } catch (err) {
    throw new Error('500');
  }
};

export const create = async (comment: CommentModel) => {
  try {
    const savedComment = await Comment.create(comment);
    return savedComment;
  } catch (err) {
    throw new Error('500');
  }
};

const dalComment = {
  getByPost,
  getAmountByPost,
  create
};

export default dalComment;