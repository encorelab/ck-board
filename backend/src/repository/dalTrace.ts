import Trace, { TraceModel } from "../models/trace";

export const create = async (trace: TraceModel) => {
  const createdTrace = await Trace.create(trace);
  return createdTrace;
};

const dalTrace = {
  create,
};

export default dalTrace;
