import Trace, { TraceModel } from '../models/Trace';

const create = async (trace: TraceModel) => {
  const createdTrace = await Trace.create(trace);
  return createdTrace;
};

const getLastModifiedPost = async (postID: string, eventType: string) => {
  const lastModifiedPost = await Trace.find({
    'event.postID': postID,
    eventType: eventType,
  })
    .sort({ updatedAt: -1 })
    .limit(1)
    .exec();

  return lastModifiedPost[0];
};

const getAllTrace = async (projectID: string) => {
  return Trace.find({ projectID: projectID }).sort({ updatedAt: -1 }).limit(50);
};

const dalTrace = {
  create,
  getLastModifiedPost,
  getAllTrace,
};

export default dalTrace;
