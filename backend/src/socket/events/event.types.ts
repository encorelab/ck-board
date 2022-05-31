import { PostModel } from "../../models/Post";
import { TagModel } from "../../models/Tag";

interface TraceContext {
  projectID: string;
  boardID: string;
  userID: string;
}
interface SocketPayload {
  trace: TraceContext;
  eventData: any;
}
export interface PostEventInput extends SocketPayload {
  eventData: PostModel;
}
export interface PostUpdateEventInput extends SocketPayload {
  eventData: Partial<PostModel> & Pick<PostModel, "postID">;
}
export interface PostTagEventInput extends SocketPayload {
  eventData: {
    post: PostModel;
    tag: TagModel;
  };
}
