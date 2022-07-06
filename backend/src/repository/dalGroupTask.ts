import GroupTask, { GroupTaskModel } from '../models/GroupTask';

export const getById = async (id: string) => {
  try {
    const groupTask = await GroupTask.findOne({ groupTaskID: id });
    return groupTask;
  } catch (err) {
    throw new Error('500');
  }
};

export const getAllByGroupId = async (id: string) => {
  try {
    const groupTasks = await GroupTask.find({ groupID: id });
    return groupTasks;
  } catch (err) {
    throw new Error('500');
  }
};

export const getAllByWorkflowId = async (id: string) => {
  try {
    const groupTasks = await GroupTask.find({ workflowID: id });
    return groupTasks;
  } catch (err) {
    throw new Error('500');
  }
};

export const create = async (groupTask: GroupTaskModel) => {
  try {
    const savedGroupTask = await GroupTask.create(groupTask);
    return savedGroupTask;
  } catch (err) {
    throw new Error('500');
  }
};

export const remove = async (id: string) => {
  try {
    await GroupTask.findOneAndDelete({ groupTaskID: id });
  } catch (err) {
    throw new Error('500');
  }
};

// Create specific function for marking tasks as complete? Or just do through update?

export const update = async (
  id: string,
  groupTask: Partial<GroupTaskModel>
) => {
  try {
    const updatedGroupTask = await GroupTask.findOneAndUpdate(
      { groupTaskID: id },
      groupTask,
      { new: true }
    );
    return updatedGroupTask;
  } catch (err) {
    throw new Error('500');
  }
};

const dalGroupTask = {
  getById,
  getAllByGroupId,
  getAllByWorkflowId,
  create,
  remove,
  update,
};

export default dalGroupTask;
