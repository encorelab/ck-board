import { Server, Socket } from 'socket.io';
import { SocketEvent } from '../../constants';
import bucketTrace from '../trace/bucket.trace';
import { BucketEventInput, SocketPayload } from '../types/event.types';

class BucketAddPost {
  static type: SocketEvent = SocketEvent.BUCKET_ADD_POST;

  static async handleEvent(
    input: SocketPayload<BucketEventInput>
  ): Promise<BucketEventInput> {
    bucketTrace.movePostToBucket(input, this.type);
    return input.eventData;
  }

  static async handleResult(io: Server, socket: Socket, result: number) {
    io.to(socket.data.room).emit(this.type, result);
  }
}

class BucketRemovePost {
  static type: SocketEvent = SocketEvent.BUCKET_REMOVE_POST;

  static async handleEvent(
    input: SocketPayload<BucketEventInput>
  ): Promise<BucketEventInput> {
    bucketTrace.removePostFromBucket(input, this.type);
    return input.eventData;
  }

  static async handleResult(io: Server, socket: Socket, result: number) {
    io.to(socket.data.room).emit(this.type, result);
  }
}

const bucketEvents = [BucketAddPost, BucketRemovePost];
export default bucketEvents;
