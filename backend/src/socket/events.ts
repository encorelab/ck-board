import { SocketEvent } from "../constants";
import {PostModel} from "../models/Post";
import dalPost from "../repository/dalPost";

class PostCreate {
  static type: SocketEvent = SocketEvent.POST_CREATE;
  
  static async handleEvent(eventData: PostModel): Promise<PostModel> {
    const post = await dalPost.create(eventData);
    return post;
  }
}

class PostUpdate {
  static type: SocketEvent = SocketEvent.POST_UPDATE;
  
  static async handleEvent(eventData: Partial<PostModel> & Pick<PostModel, 'postID'>): Promise<PostModel | null> {
    const post = await dalPost.update(eventData.postID, eventData);
    return post;
  }
}

class PostDelete {
  static type: SocketEvent = SocketEvent.POST_DELETE;
  
  static async handleEvent(eventData: PostModel): Promise<string> {
    await dalPost.remove(eventData.postID);
    return eventData.postID;
  }
}

class PostStartMove {
  static type: SocketEvent = SocketEvent.POST_START_MOVE;
  
  static async handleEvent(eventData: PostModel): Promise<PostModel | null> {
    const post = await dalPost.update(eventData.postID, eventData);
    return post;
  }
}

class PostStopMove {
  static type: SocketEvent = SocketEvent.POST_STOP_MOVE;
  
  static async handleEvent(eventData: PostModel): Promise<PostModel | null> {
    const post = await dalPost.update(eventData.postID, eventData);
    return post;
  }
}

const events = [
  PostCreate, 
  PostUpdate,
  PostDelete,
  PostStartMove,
  PostStopMove
];

export default events;