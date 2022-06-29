import {
  WorkflowModel,
  Workflow,
  WorkflowType,
  DistributionWorkflow,
  TaskWorkflow,
} from '../models/Workflow';

export const getAllByBoardId = async (id: string) => {
  try {
    const workflows = await Workflow.find({ boardID: id });
    return workflows;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const getByBoardId = async (type: WorkflowType, id: string) => {
  try {
    if (type == WorkflowType.DISTRIBUTION) {
      return await DistributionWorkflow.find({ boardID: id });
    } else if (type == WorkflowType.TASK) {
      return await TaskWorkflow.find({ boardID: id });
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

const dalWorkflow = {
  getAllByBoardId,
  getByBoardId,
  create,
  updateDistribution,
  updateTask,
  remove,
};

export default dalWorkflow;
