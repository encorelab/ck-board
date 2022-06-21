import Comment, { CommentModel } from "../models/Comment";

export const getById = async (id: string) => {
  try {
    const comment = await Comment.findOne({ commentID: id });
    return comment;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const getByPost = async (id: string) => {
  try {
    const comments = await Comment.find({postID: id});
    return comments;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const getAmountByPost = async (id: string) => {
  try {
    const numComments = await Comment.countDocuments({postID: id});
    return numComments;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const create = async (comment: CommentModel) => {
  try {
    const savedComment = await Comment.create(comment);
    return savedComment;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const remove = async (id: string) => {
  try {
    const deletedComment = await Comment.findOneAndDelete({ commentID: id });
    return deletedComment;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

const dalComment = {
  getById,
  getByPost,
  getAmountByPost,
  create,
  remove,
};

export default dalComment;