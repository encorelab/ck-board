import dalTrace from '../../repository/dalTrace';
import { PostModel } from '../../models/Post';
import { SocketPayload } from '../types/event.types';
import { createTrace } from './base.trace';
import { UpvoteModel } from '../../models/Upvote';

/**
 * Creates trace for Tracing Enabled
 *
 * input.eventData = permissions.allowTracing. this is unused for now
 * @param input
 * @param eventType
 */
const tracingEnabled = async (
  input: SocketPayload<boolean>,
  eventType: string
) => {
  const trace = await createTrace(input.trace);
  trace.eventType = eventType;
  trace.event = {};

  await dalTrace.create(trace);
};

/**
 * Creates trace for Tracing Enabled
 *
 * input.eventData = permissions.allowTracing. this is unused for now
 * @param input
 * @param eventType
 */
const tracingDisabled = async (
  input: SocketPayload<boolean>,
  eventType: string
) => {
  const trace = await createTrace(input.trace);
  trace.eventType = eventType;
  trace.event = {};

  await dalTrace.create(trace);
};

/**
 * Creates trace for Clearing Board Upvotes
 *
 * input.eventData = list of upvotes being cleared. this is unused for now
 * @param input
 * @param eventType the associated SocketEvent
 */
const clearVotes = async (
  input: SocketPayload<UpvoteModel[]>,
  eventType: string
) => {
  const trace = await createTrace(input.trace);
  trace.eventType = eventType;
  trace.event = {};

  await dalTrace.create(trace);
};

/**
 * Creates trace for Clearing Board
 *
 * input.eventData = list of posts being cleared. this is unused for now
 * @param input
 * @param eventType the associated SocketEvent
 */
const clearBoard = async (
  input: SocketPayload<PostModel[]>,
  eventType: string
) => {
  const trace = await createTrace(input.trace);
  const post = input.eventData.at(0);
  trace.eventType = eventType;
  trace.event = {
    postID: post?.postID,
  };

  await dalTrace.create(trace);
};

const boardTrace = {
  tracingEnabled,
  tracingDisabled,
  clearVotes,
  clearBoard,
};

export default boardTrace;
