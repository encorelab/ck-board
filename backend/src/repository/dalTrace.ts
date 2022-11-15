import Trace, { TraceModel } from '../models/Trace';

export const create = async (trace: TraceModel) => {
  const createdTrace = await Trace.create(trace);
  return createdTrace;
};

export const getLastModifiedPost = async (
  postID: string,
  eventType: string
) => {
  const lastModifiedPost = await Trace.find({
    'event.postID': postID,
    eventType: eventType,
  })
    .sort({ updatedAt: -1 })
    .limit(1)
    .exec();

  return lastModifiedPost[0];
};

export const getAllTrace = async (projectID: string) => {
  return Trace.find({ projectID: projectID })
    .sort({ updatedAt: -1 })
    .limit(1000);
};

export const removeByBoard = async (boardID: string) => {
  try {
    const deletedTrace = await Trace.deleteMany({ boardID: boardID });
    return deletedTrace;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

const dalTrace = {
  create,
  getLastModifiedPost,
  getAllTrace,
  removeByBoard,
};

export default dalTrace;
