import { SocketEvent } from "../../constants";
import { CommentModel } from "../../models/Comment";
import { LikeModel } from "../../models/Like";
import { PostModel } from "../../models/Post";
import dalTrace from "../../repository/dalTrace";
import { SocketPayload } from "../events/types/event.types";
import { createTrace } from "./base.trace";
import { TraceInput } from "./types/trace.types";

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
  trace.event = {
    postID: post.postID,
    postModifiedTitle: post.title,
    postModifiedMessage: post.desc,
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
    commnetID: comment.commentID,
    commentText: comment.comment,
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
};

export default postTrace;
