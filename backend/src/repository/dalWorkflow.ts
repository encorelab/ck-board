import {
  WorkflowModel,
  Workflow,
  WorkflowType,
  DistributionWorkflow,
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
    }
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const create = async (type: WorkflowType, workflow: WorkflowModel) => {
  try {
    if (type == WorkflowType.DISTRIBUTION) {
      return await DistributionWorkflow.create(workflow);
    }
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const update = async (
  type: WorkflowType,
  id: string,
  update: Partial<WorkflowModel>
) => {
  try {
    if (type == WorkflowType.DISTRIBUTION) {
      return await DistributionWorkflow.findOneAndUpdate(
        { workflowID: id },
        update,
        { new: true }
      );
    }
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const remove = async (type: WorkflowType, id: string) => {
  try {
    if (type == WorkflowType.DISTRIBUTION) {
      return await DistributionWorkflow.findOneAndDelete({ workflowID: id });
    }
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

const dalWorkflow = {
  getAllByBoardId,
  getByBoardId,
  create,
  update,
  remove,
};

export default dalWorkflow;
