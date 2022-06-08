import Bucket, { BucketModel } from "../models/Bucket";

export const getById = async (id: string) => {
  try {
    const bucket = await Bucket.findOne({ bucketID: id });
    return bucket;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const getByBoardId = async (id: string) => {
  try {
    const buckets = await Bucket.find({ boardID: id });
    return buckets;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const getByPostId = async (id: string) => {
  try {
    const buckets = await Bucket.find({ posts: id });
    return buckets;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const create = async (bucket: BucketModel) => {
  try {
    const savedBucket = await Bucket.create(bucket);
    return savedBucket;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const update = async (id: string, bucket: Partial<BucketModel>) => {
  try {
    const updatedBucket = await Bucket.findOneAndUpdate(
      { bucketID: id },
      bucket,
      { new: true }
    );
    return updatedBucket;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const remove = async (id: string) => {
  try {
    const deletedBucket = await Bucket.findOneAndDelete({ bucketID: id });
    return deletedBucket;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const addPost = async (id: string, posts: string[]) => {
  try {
    const updatedBucket = await Bucket.findOneAndUpdate(
      { bucketID: id },
      { $addToSet: { posts: { $each: posts } } },
      { new: true }
    );
    return updatedBucket;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

export const removePost = async (id: string, posts: string[]) => {
  try {
    const updatedBucket = await Bucket.findOneAndUpdate(
      { bucketID: id },
      { $pull: { posts: { $in: posts } } },
      { new: true }
    );
    return updatedBucket;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, " "));
  }
};

const dalBucket = {
  getById,
  getByBoardId,
  getByPostId,
  create,
  remove,
  update,
  addPost,
  removePost,
};

export default dalBucket;
