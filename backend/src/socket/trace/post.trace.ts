import { SocketEvent } from "../../constants";
import { PostModel } from "../../models/Post";
import dalTrace from "../../repository/dalTrace";
import { SocketPayload } from "../events/types/event.types";
import { createTrace } from "./base.trace";

export const create = async (input: SocketPayload<PostModel>) => {
  const trace = await createTrace(input.trace);
  const post = input.eventData;
  const event = {
    postID: post.postID,
    postTitle: post.title,
    postMessage: post.desc,
  };
  trace.event = event;
  trace.eventType = SocketEvent.POST_CREATE;
  dalTrace.create(trace);
};

const postTrace = {
  create,
};

export default postTrace;
