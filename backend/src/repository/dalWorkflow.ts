import Workflow, { WorkflowModel } from "../models/Workflow";

export const getByBoardId = async (id: string) => {
  try {
    const workflows = await Workflow.find({ boardID: id });
    return workflows;
  } catch (err) {
    throw new Error("500");
  }
};

export const create = async (workflow: WorkflowModel) => {
  try {
    const savedWorkflow = await Workflow.create(workflow);
    return savedWorkflow;
  } catch (err) {
    throw new Error("500");
  }
};

export const update = async (id: string, workflow: Partial<WorkflowModel>) => {
  try {
    const updatedWorkflow = await Workflow.findOneAndUpdate(
      { workflowID: id },
      workflow,
      { new: true }
    );
    return updatedWorkflow;
  } catch (err) {
    throw new Error("500");
  }
};

export const remove = async (id: string) => {
  try {
    await Workflow.findOneAndDelete({ workflowID: id });
  } catch (err) {
    throw new Error("500");
  }
};

const dalWorkflow = {
  getByBoardId,
  create,
  update,
  remove,
};

export default dalWorkflow;
