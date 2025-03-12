import { PostModel } from '../../models/Post';
import dalTrace from '../../repository/dalTrace';
import { SocketPayload } from '../types/event.types';
import { createTrace } from './base.trace';

const addPost = async (input: SocketPayload<PostModel>, eventType: string) => {
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

const workflowTrace = {
  addPost,
};

export default workflowTrace;
