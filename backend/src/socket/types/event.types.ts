import { PostModel } from '../../models/Post';
import { TagModel } from '../../models/Tag';

export interface TraceContext {
  projectID: string;
  boardID: string;
  userID: string;
  clientTimestamp: number;
  allowTracing: boolean;
}
export interface SocketPayload<T> {
  trace: TraceContext;
  eventData: T;
}

export type PostTagEventInput = {
  post: PostModel;
  tag: TagModel;
};

export type PostStopMoveEventInput = {
  postID: string;
  left: number;
  top: number;
};

export type PersonalBoardAddPostEventInput = {
  originalPostID: string;
  newPostID: string;
  personalBoardID: string;
}

export type BucketEventInput = {
  bucketID: string;
  posts: string[];
};
