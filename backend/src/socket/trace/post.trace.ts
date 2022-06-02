import { CommentModel } from "../../models/Comment";
import { LikeModel } from "../../models/Like";
import { PostModel } from "../../models/Post";
import dalTrace from "../../repository/dalTrace";
import { PostTagEventInput, SocketPayload } from "../events/types/event.types";
import { createTrace } from "./base.trace";

const create = async (input: SocketPayload<PostModel>, eventType: string) => {
  const trace = await createTrace(input.trace);
  const post = input.eventData;
  trace.event = {
    postID: post.postID,
    postTitle: post.title,
    postMessage: post.desc,
  };
  trace.eventType = eventType;
  dalTrace.create(trace);
};

const update = async (
  input: SocketPayload<Partial<PostModel> & Pick<PostModel, "postID">>,
  eventType: string
) => {
  const trace = await createTrace(input.trace);
  const post = input.eventData;
  const lastModifiedPost = await dalTrace.getLastModifiedPost(
    post.postID,
    eventType
  );
  let counter = 1;
  if (lastModifiedPost) {
    counter = lastModifiedPost.event?.commentModifiedTextCounter + 1;
  }
  trace.event = {
    postID: post.postID,
    postModifiedTitle: post.title,
    postModifiedMessage: post.desc,
    commentModifiedTextCounter: counter,
  };
  trace.eventType = eventType;
  dalTrace.create(trace);
};
// can't name function delete
const remove = async (input: SocketPayload<PostModel>, eventType: string) => {
  const trace = await createTrace(input.trace);
  const post = input.eventData;
  trace.event = {
    postID: post.postID,
    deleted: 1,
  };
  trace.eventType = eventType;
  dalTrace.create(trace);
};

const likeAdd = async (input: SocketPayload<LikeModel>, eventType: string) => {
  const trace = await createTrace(input.trace);
  const like = input.eventData;
  trace.event = {
    postID: like.postID,
    postModifiedUpvote: 1,
  };
  trace.eventType = eventType;
  dalTrace.create(trace);
};

const likeRemove = async (
  input: SocketPayload<LikeModel>,
  eventType: string
) => {
  const trace = await createTrace(input.trace);
  const like = input.eventData;
  trace.event = {
    postID: like.postID,
    postModifiedUpvote: -1,
  };
  trace.eventType = eventType;
  dalTrace.create(trace);
};

const commentAdd = async (
  input: SocketPayload<CommentModel>,
  eventType: string
) => {
  const trace = await createTrace(input.trace);
  const comment = input.eventData;
  trace.event = {
    postID: comment.postID,
    commentID: comment.commentID,
    commentText: comment.comment,
  };
  trace.eventType = eventType;
  dalTrace.create(trace);
};

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
  };
  trace.eventType = eventType;
  dalTrace.create(trace);
};

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
  };
  trace.eventType = eventType;
  dalTrace.create(trace);
};

// Placeholder not done yet
const move = async (input: SocketPayload<PostModel>, eventType: string) => {
  const trace = await createTrace(input.trace);
  const post = input.eventData;
  trace.event = {
    postID: post.postID,
    postModifiedLocationX: 0,
    postModifiedLocationY: 0,
  };
  trace.eventType = eventType;
  dalTrace.create(trace);
};

// Placeholder not done yet
const read = async (input: SocketPayload<PostModel>, eventType: string) => {
  const trace = await createTrace(input.trace);
  const post = input.eventData;
  trace.event = {
    postID: post.postID,
    postRead: 1,
  };
  trace.eventType = eventType;
  dalTrace.create(trace);
};

const postTrace = {
  create,
  update,
  remove,
  likeAdd,
  likeRemove,
  commentAdd,
  tagAdd,
  tagRemove,
  move,
  read,
};

export default postTrace;
