import Like, { LikeModel } from "../models/Like";

export const getByPost = async (id: string) => {
  try {
    const likes = await Like.find({ postID: id });
    return likes;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const getAmountByPost = async (id: string) => {
  try {
    const numLikes = await Like.countDocuments({ postID: id });
    return numLikes;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const isLikedBy = async (postID: string, likerID: string) => {
  try {
    const like = await Like.findOne({ postID, likerID });
    return like;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const create = async (like: LikeModel) => {
  try {
    const savedLike = await Like.create(like);
    return savedLike;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const remove = async (userID: string, postID: string) => {
  try {
    return await Like.findOneAndDelete({ likerID: userID, postID });
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

const dalLike = {
  getByPost,
  getAmountByPost,
  isLikedBy,
  create,
  remove,
};

export default dalLike;
