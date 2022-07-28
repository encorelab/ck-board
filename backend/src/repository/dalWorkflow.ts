import {
  WorkflowModel,
  Workflow,
  WorkflowType,
  DistributionWorkflow,
  TaskWorkflow,
} from '../models/Workflow';

export const getById = async (id: string) => {
  try {
    const workflow = await Workflow.findOne({ workflowID: id });
    return workflow;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const getByIds = async (ids: string[]) => {
  try {
    const workflows = await Workflow.find({ workflowID: { $in: ids } });
    return workflows;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const getAllByBoardId = async (id: string) => {
  try {
    const workflows = await Workflow.find({ boardID: id });
    return workflows;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const getByBoardId = async (type: WorkflowType, boardID: string, active?: boolean) => {
  try {
    const query = Object.assign(
      {},
      boardID === null ? null : { boardID },
      active === null ? null : { active },
    );

    if (type == WorkflowType.DISTRIBUTION) {
      return await DistributionWorkflow.find(query);
    } else if (type == WorkflowType.TASK) {
      return await TaskWorkflow.find(query);
    }
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const create = async (type: WorkflowType, workflow: WorkflowModel) => {
  try {
    if (type == WorkflowType.DISTRIBUTION) {
      return await DistributionWorkflow.create(workflow);
    } else if (type == WorkflowType.TASK) {
      return await TaskWorkflow.create(workflow);
    }
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const updateDistribution = async (
  id: string,
  update: Partial<WorkflowModel>
) => {
  try {
    return await DistributionWorkflow.findOneAndUpdate(
      { workflowID: id },
      update,
      { new: true }
    );
  } catch (err) {
    throw new Error('500');
  }
};

export const updateTask = async (
  id: string,
  update: Partial<WorkflowModel>
) => {
  try {
    return await TaskWorkflow.findOneAndUpdate({ workflowID: id }, update, {
      new: true,
    });
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const remove = async (type: WorkflowType, id: string) => {
  try {
    if (type == WorkflowType.DISTRIBUTION) {
      return await DistributionWorkflow.findOneAndDelete({ workflowID: id });
    } else if (type == WorkflowType.TASK) {
      return await TaskWorkflow.findOneAndDelete({ workflowID: id });
    }
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const removeByBoard = async (boardID: string) => {
  try {
    return await DistributionWorkflow.deleteMany({ boardID: boardID });
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

const dalWorkflow = {
  getById,
  getByIds,
  getAllByBoardId,
  getByBoardId,
  create,
  updateDistribution,
  updateTask,
  remove,
  removeByBoard,
};

export default dalWorkflow;
