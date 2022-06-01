import { BucketModel } from "../../models/Bucket";
import dalTrace from "../../repository/dalTrace";
import { SocketPayload } from "../events/types/event.types";
import { createTrace } from "./base.trace";

// Placeholder not done yet
const movePostToBucket = async (
  input: SocketPayload<BucketModel>,
  eventType: string
) => {
  const trace = await createTrace(input.trace);
  const bucket = input.eventData;
  trace.event = {
    bucketID: bucket.boardID,
    bucketName: bucket.name,
    // will prob need bucket and post in payload
    postID: "",
  };
  trace.eventType = eventType;
  dalTrace.create(trace);
};

const bucketTrace = {
  movePostToBucket,
};

export default bucketTrace;
