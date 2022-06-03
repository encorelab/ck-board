import { Server, Socket } from "socket.io";
import { SocketEvent } from "../../constants";
import bucketTrace from "../trace/bucket.trace";
import { BucketEventInput, SocketPayload } from "../types/event.types";

class BucketAddPost {
  static type: SocketEvent = SocketEvent.BUCKET_ADD_POST;

  static async handleEvent(
    input: SocketPayload<BucketEventInput>
  ): Promise<BucketEventInput> {
    bucketTrace.movePostToBucket(input, this.type);
    return input.eventData;
  }

  static async handleResult(io: Server, socket: Socket, result: number) {
    // dont need to emit for now
  }
}

const bucketEvents = [BucketAddPost];
export default bucketEvents;
