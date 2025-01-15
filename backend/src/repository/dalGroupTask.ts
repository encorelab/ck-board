import GroupTask, { GroupTaskModel } from '../models/GroupTask';
import mongoose from 'mongoose';
import dalGroup from './dalGroup';
import dalWorkflow from './dalWorkflow';
import { TaskWorkflowModel } from '../models/Workflow';
import { isTask } from '../utils/workflow.helpers';
import { GroupModel } from '../models/Group';

export interface GroupTaskExpanded {
  groupTask: GroupTaskModel;
  workflow: TaskWorkflowModel;
  group: GroupModel;
}

export const expandGroupTask = async (
  task: GroupTaskModel
): Promise<GroupTaskExpanded> => {
  const workflow = await dalWorkflow.getById(task.workflowID);

  if (!workflow || !isTask<TaskWorkflowModel>(workflow))
    throw new Error(
      `No task workflow associated with group task (id: ${task.groupTaskID})`
    );

  const group = await dalGroup.getById(task.groupID);
  if (!group)
    throw new Error(`No group associated with group id: ${task.groupID}`);

  return {
    groupTask: task,
    workflow: workflow,
    group: group,
  };
};

export const expandGroupTasks = async (
  tasks: GroupTaskModel[]
): Promise<GroupTaskExpanded[]> => {
  const workflows = await dalWorkflow.getByIds(tasks.map((u) => u.workflowID));

  return await Promise.all(
    tasks.map(async (task) => {
      const workflow = workflows.find((u) => u.workflowID == task.workflowID);
      if (!workflow || !isTask<TaskWorkflowModel>(workflow))
        throw new Error(
          `No task workflow associated with group task (id: ${task.groupTaskID})`
        );

      const group = await dalGroup.getById(task.groupID);
      if (!group)
        throw new Error(`No group associated with group id: ${task.groupID}`);

      return {
        groupTask: task,
        workflow: workflow,
        group: group,
      };
    })
  );
};

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

export const getByUserAndPost = async (user: string, post: string) => {
  try {
    const groups = (await dalGroup.getByUserId(user)).map((g) => g.groupID);
    const groupTasks = await GroupTask.find({
      groupID: { $in: groups },
      posts: post,
    });
    return groupTasks;
  } catch (err) {
    throw new Error('500');
  }
};

export const getByBoardAndUser = async (board: string, user: string) => {
  try {
    const groups = (await dalGroup.getByUserId(user)).map((g) => g.groupID);
    const workflows = (await dalWorkflow.getAllByBoardId(board)).map(
      (g) => g.workflowID
    );
    const groupTasks = await GroupTask.find({
      groupID: { $in: groups },
      workflowID: { $in: workflows },
    });
    const filteredGroupTasks = groupTasks.filter(
      (t) => t.userID === user || !t.userID
    );
    return filteredGroupTasks;
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

export const getByWorkflowGroup = async (
  workflowID: string,
  groupID: string,
  userID: string
) => {
  try {
    let groupTask = await GroupTask.findOne({
      workflowID: workflowID,
      groupID: groupID,
    });
    if (groupTask?.userID) {
      groupTask = await GroupTask.findOne({
        workflowID: workflowID,
        groupID: groupID,
        userID: userID,
      });
    }
    return groupTask;
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

export const removeByWorkflow = async (workflowID: string) => {
  try {
    return await GroupTask.deleteMany({ workflowID });
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
    const initialGroupTask = await GroupTask.findOne({ groupTaskID: id });
    let updatedGroupTask;
    if (initialGroupTask?.userID) {
      updatedGroupTask = await GroupTask.findOneAndUpdate(
        { groupTaskID: id, userID: initialGroupTask.userID },
        groupTask,
        { new: true }
      );
    } else {
      updatedGroupTask = await GroupTask.findOneAndUpdate(
        { groupTaskID: id },
        groupTask,
        { new: true }
      );
    }
    return updatedGroupTask;
  } catch (err) {
    throw new Error('500');
  }
};

export const updateMany = async (groupTasks: GroupTaskModel[]) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    return await Promise.all(
      groupTasks.map(async (groupTask) => {
        return await GroupTask.findOneAndUpdate(
          { groupTaskID: groupTask.groupTaskID },
          groupTask,
          { new: true }
        );
      })
    );
  } catch (err) {
    throw new Error('500');
  } finally {
    session.endSession();
  }
};

export const removePosts = async (
  id: string,
  posts: string[],
  userID?: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (userID) {
      return await GroupTask.findOneAndUpdate(
        { groupTaskID: id, userID: userID },
        { $pull: { posts: { $in: posts } } },
        { new: true }
      );
    } else {
      return await GroupTask.findOneAndUpdate(
        { groupTaskID: id },
        { $pull: { posts: { $in: posts } } },
        { new: true }
      );
    }
  } catch (err) {
    throw new Error('500');
  } finally {
    session.endSession();
  }
};

const dalGroupTask = {
  expandGroupTask,
  expandGroupTasks,
  getById,
  getAllByGroupId,
  getAllByWorkflowId,
  getByWorkflowGroup,
  getByUserAndPost,
  getByBoardAndUser,
  create,
  remove,
  removeByWorkflow,
  update,
  updateMany,
  removePosts,
};

export default dalGroupTask;
