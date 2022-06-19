import Upvote, { UpvoteModel } from "../models/Upvote";

export const getByPost = async (id: string) => {
  try {
    const upvotes = await Upvote.find({ postID: id });
    return upvotes;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const getAmountByPost = async (id: string) => {
  try {
    const numUpvotes = await Upvote.countDocuments({ postID: id });
    return numUpvotes;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const getByBoardAndUser = async (boardID: string, voterID: string) => {
  try {
    const numUpvotes = await Upvote.countDocuments({ boardID, voterID });
    return numUpvotes;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const isUpvotedBy = async (postID: string, voterID: string) => {
  try {
    const upvote = await Upvote.findOne({ postID, voterID });
    return upvote;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const create = async (upvote: UpvoteModel) => {
  try {
    const savedUpvote = await Upvote.create(upvote);
    return savedUpvote;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const remove = async (userID: string, postID: string) => {
  try {
    return await Upvote.findOneAndDelete({ voterID: userID, postID });
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

const dalVote = {
  getByPost,
  getAmountByPost,
  getByBoardAndUser,
  isUpvotedBy,
  create,
  remove,
};

export default dalVote;
