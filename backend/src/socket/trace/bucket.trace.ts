import { BucketModel } from '../../models/Bucket';
import dalBucket from '../../repository/dalBucket';
import dalTrace from '../../repository/dalTrace';
import { BucketEventInput, SocketPayload } from '../types/event.types';
import { createTrace } from './base.trace';

/**
 * Creates a trace for each post moved to bucket
 * input.eventData.posts is string[] of postIDs
 * input.eventData.bucketID is the destination bucketID
 * @param input
 * @param eventType
 * @returns
 */
const movePostToBucket = async (
  input: SocketPayload<BucketEventInput>,
  eventType: string
) => {
  const trace = await createTrace(input.trace);
  const bucketEvent = input.eventData;
  const bucket = await dalBucket.getById(bucketEvent.bucketID);
  if (!bucket) return;
  // create a trace for each postID in posts
  const tracePromises = bucketEvent.posts.map(async (postID) => {
    trace.event = {
      postMovedToBucketID: bucket.bucketID,
      postMovedToBucketName: bucket.name,
      postID: postID,
    };
    trace.eventType = eventType;
    return dalTrace.create(trace);
  });
  await Promise.all(tracePromises);
};
/**
 * Creates a trace for each post removed from a bucket
 * input.eventData.posts is string[] of postIDs
 * input.eventData.bucketID is the bucketID of the bucket from which the post was removed
 * @param input
 * @param eventType
 * @returns
 */
const removePostFromBucket = async (
  input: SocketPayload<BucketEventInput>,
  eventType: string
) => {
  const trace = await createTrace(input.trace);
  const bucketEvent = input.eventData;
  const bucket = await dalBucket.getById(bucketEvent.bucketID);
  if (!bucket) return;
  // create a trace for each postID in posts
  const tracePromises = bucketEvent.posts.map(async (postID) => {
    trace.event = {
      postRemovedFromBucketID: bucket.bucketID,
      postRemovedFromBucketName: bucket.name,
      postID: postID,
    };
    trace.eventType = eventType;
    return dalTrace.create(trace);
  });
  await Promise.all(tracePromises);
};

const bucketTrace = {
  movePostToBucket,
  removePostFromBucket,
};

export default bucketTrace;
