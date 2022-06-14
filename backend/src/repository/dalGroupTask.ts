import GroupTask, { GroupTaskModel } from "../models/GroupTask";

export const getById = async (id: string) => {
    try {
        const groupTask = await GroupTask.findOne({ groupTaskID: id });
        return groupTask;
    } catch (err) {
        throw new Error("500");
    }
}

export const getAllByGroupId = async (id: string) => {
  try {
    const groupTasks = await GroupTask.find({ groupID: id });
    return groupTasks;
  } catch (err) {
    throw new Error("500");
  }
};

export const getAllByWorkflowId = async (id: string) => {
  try {
    const groupTasks = await GroupTask.find({ workflowID: id });
    return groupTasks;
  } catch (err) {
    throw new Error("500");
  }
};

const dalGroupTask = {
  getById,
  getAllByGroupId,
};

export default dalGroupTask;