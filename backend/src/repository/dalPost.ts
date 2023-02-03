import mongoose from 'mongoose';
import { flatten } from 'mongo-dot-notation';
import { NotFoundError } from '../errors/client.errors';
import { BucketModel } from '../models/Bucket';
import Post, { PostModel, PostType } from '../models/Post';
import { Options } from '../utils/api.helpers';
import dalBucket from './dalBucket';
import dalComment from './dalComment';
import dalVote from './dalVote';

export const getById = async (id: string) => {
  try {
    const post = await Post.findOne({ postID: id });
    return post;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const getManyById = async (ids: string[]) => {
  try {
    const post = await Post.find({ postID: ids });
    return post;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const getByBoard = async (boardID: string, type?: any) => {
  try {
    let posts;
    if (type) {
      posts = await Post.find({ boardID: boardID, type: type });
    } else {
      posts = await Post.find({ boardID });
    }
    return posts;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const getByBucket = async (bucketID: string, opts?: Options) => {
  try {
    const bucket = await dalBucket.getById(bucketID);
    if (!bucket)
      throw new NotFoundError(`Bucket with ID: ${bucketID} not found!`);

    let posts;
    if (opts) {
      const { size, page } = opts;
      posts = await Post.find({ postID: bucket.posts })
        .limit(size)
        .skip(size * page);
    } else {
      posts = await Post.find({ postID: bucket.posts });
    }
    const count = await Post.find({ postID: bucket.posts }).count();
    return { posts, count };
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const create = async (post: PostModel) => {
  try {
    const savedPost = await Post.create(post);
    return savedPost;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
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
    throw new Error(JSON.stringify(err, null, ' '));
  } finally {
    await session.endSession();
  }
};

export const removeByBoard = async (boardID: string) => {
  try {
    const deletedPosts = await Post.deleteMany({ boardID: boardID });
    return deletedPosts;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const update = async (id: string, post: Partial<PostModel>) => {
  try {
    const setPost: any = flatten(post);

    const updatedPost = await Post.findOneAndUpdate({ postID: id }, setPost, {
      new: true,
    });
    return updatedPost;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const createMany = async (posts: PostModel[]) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const savedPosts = await Post.insertMany(posts);
    return savedPosts;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
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

const formatAttributes = (post: Partial<PostModel>) => {
  if (!post.displayAttributes) return {};

  const displayAttributes = post.displayAttributes;
  delete post.displayAttributes;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: any = {};
  for (const [key, value] of Object.entries(displayAttributes)) {
    update[`displayAttributes.${key}`] = value;
  }

  return update;
};

const dalPost = {
  getById,
  getByBoard,
  getByBucket,
  getManyById,
  create,
  createMany,
  remove,
  removeByBoard,
  update,
};

export default dalPost;
