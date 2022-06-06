import { CommentModel } from "../../models/Comment";
import { LikeModel } from "../../models/Like";
import { PostModel } from "../../models/Post";
import dalTrace from "../../repository/dalTrace";
import { PostTagEventInput, SocketPayload } from "../types/event.types";
import { createTrace } from "./base.trace";

const create = async (input: SocketPayload<PostModel>, eventType: string) => {
  const trace = await createTrace(input.trace);
  const post = input.eventData;
  trace.event = {
    postID: post.postID,
    postModifiedTitle: post.title,
    postModifiedMessage: post.desc,
  };
  trace.eventType = eventType;
  return dalTrace.create(trace);
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
// can't name function delete
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

const likeAdd = async (input: SocketPayload<LikeModel>, eventType: string) => {
  const trace = await createTrace(input.trace);
  const like = input.eventData;
  trace.event = {
    postID: like.postID,
    postModifiedUpvote: 1,
  };
  trace.eventType = eventType;
  return dalTrace.create(trace);
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
  return dalTrace.create(trace);
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
    commentModifiedText: comment.comment,
  };
  trace.eventType = eventType;
  return dalTrace.create(trace);
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
  return dalTrace.create(trace);
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
  return dalTrace.create(trace);
};

const move = async (input: SocketPayload<PostModel>, eventType: string) => {
  const post = input.eventData;
  if (!post.fabricObject) {
    return;
  }
  const trace = await createTrace(input.trace);

  let parsed = JSON.parse(post.fabricObject);

  trace.event = {
    postID: post.postID,
    postModifiedLocationX: parsed.left,
    postModifiedLocationY: parsed.top,
  };
  trace.eventType = eventType;
  return dalTrace.create(trace);
};

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
  likeAdd,
  likeRemove,
  commentAdd,
  tagAdd,
  tagRemove,
  move,
  read,
};

export default postTrace;
