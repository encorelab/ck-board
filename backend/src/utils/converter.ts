import { BucketModel } from '../models/Bucket';
import { PostModel } from '../models/Post';
import dalPost from '../repository/dalPost';

export const convertPostFromID = async (postID: string): Promise<PostModel> => {
  const post = await dalPost.getById(postID);
  if (post == null) throw new Error('500');

  return post;
};

export const convertPostsFromID = async (
  posts: string[]
): Promise<PostModel[]> => {
  return await Promise.all(posts.map((post) => convertPostFromID(post)));
};

export const convertBucket = async (bucket: BucketModel) => {
  return Object.assign(bucket, {
    posts: await convertPostsFromID(bucket.posts),
  });
};

export const convertBuckets = async (buckets: BucketModel[]) => {
  return await Promise.all(buckets.map((bucket) => convertBucket(bucket)));
};

const converter = [
  convertPostFromID,
  convertPostsFromID,
  convertBucket,
  convertBuckets,
];

export default converter;
