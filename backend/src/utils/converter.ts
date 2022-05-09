import { BucketModel } from "../models/Bucket";
import dalPost from "../repository/dalPost";

export const convertPostFromID = async (postID: string) => {
  return await dalPost.getById(postID);
};

export const convertPostsFromID = async (posts: string[]) => {
  return await Promise.all(posts.map(post => convertPostFromID(post)));
};

export const convertBucket = async (bucket: BucketModel) => {
  return Object.assign(bucket, {
    posts: await convertPostsFromID(bucket.posts)
  });
};

export const convertBuckets = async (buckets: BucketModel[]) => {
  return await Promise.all(buckets.map(bucket => convertBucket(bucket)));
};

const converter = [
  convertPostFromID,
  convertPostsFromID,
  convertBucket,
  convertBuckets,
]

export default converter;