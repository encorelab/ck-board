import {
  prop,
  getModelForClass,
  modelOptions,
  getDiscriminatorModelForClass,
} from "@typegoose/typegoose";

import { UserModel } from "./User"
import { GroupModel } from "./Group";


export enum WorkflowType {
  DISTRIBUTION = "DISTRIBUTION",
  TASK = "TASK",
}

export enum ContainerType {
  BOARD = "BOARD",
  BUCKET = "BUCKET",
}

export enum TaskActionType {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  TAG = 'TAG',
}


export class Container {
  @prop({ enum: ContainerType, type: String, required: true })
  public type!: ContainerType;

  @prop({ required: true })
  public id!: string;

  @prop({ required: true })
  public name!: string;
}

export class TaskAction {
  @prop({ enum: TaskActionType, type: String, required: true })
  public type!: TaskActionType;

  @prop({ required: true })
  public amountRequired!: number;
}

@modelOptions({ schemaOptions: { collection: "workflows", timestamps: true } })
export class WorkflowModel {
  @prop({ required: true })
  public workflowID!: string;

  @prop({ required: true })
  public boardID!: string;

  @prop({ required: true })
  public active!: boolean;

  @prop({ required: true })
  public name!: string;

  @prop({ required: true, type: () => Container })
  public source!: Container;

  @prop({ required: true, type: () => [Container] })
  public destinations!: Container[];
}

export class DistributionWorkflowModel extends WorkflowModel {
  @prop({ required: true })
  public postsPerDestination!: number;
}


export class TaskWorkflowModel extends WorkflowModel {
  @prop({ required: true})
  public prompt!: string;  
  
  @prop({ required: true, type: () => [TaskAction]})
  public requiredActions!: TaskAction[]; 

  @prop({ required: true, type: () => [TaskAction]})
  public optionalActions!: TaskAction[]; // Can be empty

  @prop({ required: true, type: () => [GroupModel]})
  public assignedGroups!: GroupModel[]; 

  @prop({ required: true})
  public postsPerGroup!: number;
}

export const Workflow = getModelForClass(WorkflowModel);
export const DistributionWorkflow = getDiscriminatorModelForClass(
  Workflow,
  DistributionWorkflowModel,
  WorkflowType.DISTRIBUTION
);
export const TaskWorkflow = getDiscriminatorModelForClass(
  Workflow,
  TaskWorkflowModel,
  WorkflowType.TASK
);

