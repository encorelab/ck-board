import { CommentModel } from '../../models/Comment';
import { UpvoteModel } from '../../models/Upvote';
import { PostModel } from '../../models/Post';
import dalTrace from '../../repository/dalTrace';
import {
  PostStopMoveEventInput,
  PostTagEventInput,
  SocketPayload,
} from '../types/event.types';
import { createTrace } from './base.trace';

/**
 * Creates a trace for post creation
 * @param input
 * @param eventType the associated SocketEvent
 * @returns
 */
const create = async (input: SocketPayload<PostModel>, eventType: string) => {
  const trace = await createTrace(input.trace);
  const post = input.eventData;
  const tagNames: string[] = [];
  const tagIDs: string[] = [];
  if (post.tags.length > 0) {
    post.tags.forEach((tag) => {
      tagNames.push(tag.name);
      tagIDs.push(tag.tagID);
    });
    trace.event = {
      postID: post.postID,
      postModifiedTitle: post.title,
      postModifiedMessage: post.desc,
      postTagNameAdded: tagNames.toString(),
      postTagIDAdded: tagIDs.toString(),
    };
  } else {
    trace.event = {
      postID: post.postID,
      postModifiedTitle: post.title,
      postModifiedMessage: post.desc,
    };
  }
  trace.eventType = eventType;

  return dalTrace.create(trace);
};

/**
 * Creates a trace for post update
 * @param input partial PostModel where all properties except postID are optional
 * @param eventType the associated SocketEvent
 * @returns
 */
const update = async (
  input: SocketPayload<Partial<PostModel> & Pick<PostModel, 'postID'>>,
  eventType: string
) => {
  const trace = await createTrace(input.trace);
  const post = input.eventData;
  // find the last modified post trace
  const lastModifiedPost = await dalTrace.getLastModifiedPost(
    post.postID,
    eventType
  );
  // if found increment the existing counter. if not set counter as 1
  // the counter indicates the number of times the post has been modified
  let counter = 1;
  if (lastModifiedPost) {
    counter = lastModifiedPost.event?.postTitleOrMessageModifiedCounter + 1;
  }
  trace.event = {
    postID: post.postID,
    postModifiedTitle: post.title,
    postModifiedMessage: post.desc,
    postTitleOrMessageModifiedCounter: counter,
  };
  trace.eventType = eventType;
  return dalTrace.create(trace);
};

/**
 * Creates a trace for post deletion
 * @param input
 * @param eventType the associated SocketEvent
 * @returns
 */
const remove = async (input: SocketPayload<PostModel>, eventType: string) => {
  const trace = await createTrace(input.trace);
  const post = input.eventData;
  trace.event = {
    postID: post.postID,
    postDeleted: 1,
  };
  trace.eventType = eventType;
  return dalTrace.create(trace);
};

/**
 * Creates trace for upvoting a post
 * @param input
 * @param eventType the associated SocketEvent
 * @returns
 */
const upvoteAdd = async (
  input: SocketPayload<UpvoteModel>,
  eventType: string
) => {
  const trace = await createTrace(input.trace);
  const upvote = input.eventData;
  trace.event = {
    postID: upvote.postID,
    postModifiedUpvote: 1,
  };
  trace.eventType = eventType;
  return dalTrace.create(trace);
};

/**
 * Creates trace for removing an upvote from a post
 * @param input
 * @param eventType the associated SocketEvent
 * @returns
 */
const upvoteRemove = async (
  input: SocketPayload<UpvoteModel>,
  eventType: string
) => {
  const trace = await createTrace(input.trace);
  const upvote = input.eventData;
  trace.event = {
    postID: upvote.postID,
    postModifiedUpvote: -1,
  };
  trace.eventType = eventType;
  return dalTrace.create(trace);
};

/**
 * Creates trace for adding a comment to a post
 * @param input
 * @param eventType the associated SocketEvent
 * @returns
 */
const commentAdd = async (
  input: SocketPayload<CommentModel>,
  eventType: string
) => {
  const trace = await createTrace(input.trace);
  const comment = input.eventData;
  trace.event = {
    postID: comment.postID,
    commentID: comment.commentID,
    commentModifiedText: comment.comment,
  };
  trace.eventType = eventType;
  return dalTrace.create(trace);
};

const commentRemove = async (
  input: SocketPayload<CommentModel>,
  eventType: string
) => {
  const trace = await createTrace(input.trace);
  const comment = input.eventData;
  trace.event = {
    commentID: comment.commentID,
    commentDeleted: 1,
  };
  trace.eventType = eventType;
  return dalTrace.create(trace);
};

/**
 * Creates trace for adding a tag to a post
 * @param input
 * @param eventType the associated SocketEvent
 * @returns
 */
const tagAdd = async (
  input: SocketPayload<PostTagEventInput>,
  eventType: string
) => {
  const trace = await createTrace(input.trace);
  const post = input.eventData.post;
  const tag = input.eventData.tag;
  trace.event = {
    postID: post.postID,
    postTagNameAdded: tag.name,
    postTagIDAdded: tag.tagID,
  };
  trace.eventType = eventType;
  return dalTrace.create(trace);
};

/**
 * Creates trace for removing a tag from a post
 * @param input
 * @param eventType the associated SocketEvent
 * @returns
 */
const tagRemove = async (
  input: SocketPayload<PostTagEventInput>,
  eventType: string
) => {
  const trace = await createTrace(input.trace);
  const post = input.eventData.post;
  const tag = input.eventData.tag;
  trace.event = {
    postID: post.postID,
    postTagNameRemoved: tag.name,
    postTagIDRemoved: tag.tagID,
  };
  trace.eventType = eventType;
  return dalTrace.create(trace);
};

/**
 * Creates trace for moving a post on the canvas
 * @param input
 * @param eventType the associated SocketEvent
 * @returns
 */
const move = async (
  input: SocketPayload<PostStopMoveEventInput>,
  eventType: string
) => {
  const trace = await createTrace(input.trace);
  trace.event = {
    postID: input.eventData.postID,
    postModifiedLocationX: input.eventData.left,
    postModifiedLocationY: input.eventData.top,
  };
  trace.eventType = eventType;
  return dalTrace.create(trace);
};

/**
 * Creates trace for when a user reads a post.
 * Occurs when they open the post modal
 * @param input
 * @param eventType the associated SocketEvent
 * @returns
 */
const read = async (input: SocketPayload<string>, eventType: string) => {
  const trace = await createTrace(input.trace);
  const postID = input.eventData;
  trace.event = {
    postID: postID,
    postRead: 1,
  };
  trace.eventType = eventType;
  return dalTrace.create(trace);
};

const postTrace = {
  create,
  update,
  remove,
  upvoteAdd,
  upvoteRemove,
  commentAdd,
  commentRemove,
  tagAdd,
  tagRemove,
  move,
  read,
};

export default postTrace;
