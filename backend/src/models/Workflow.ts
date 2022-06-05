import {
  prop,
  getModelForClass,
  modelOptions,
  getDiscriminatorModelForClass,
} from "@typegoose/typegoose";

import { UserModel } from "./User"


export enum WorkflowType {
  DISTRIBUTION = "DISTRIBUTION",
  TASK = "TASK",
}

export enum ContainerType {
  BOARD = "BOARD",
  BUCKET = "BUCKET",
}


export enum TaskAction {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  TAG = 'TAG',
}

export class Group {

  @prop({ required: true })
  public id!: string;

  @prop({ required: true })
  public users!: UserModel[];
}

export class Container {
  @prop({ enum: ContainerType, type: String, required: true })
  public type!: ContainerType;

  @prop({ required: true })
  public id!: string;

  @prop({ required: true })
  public name!: string;
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
  public requiredActions!: TaskAction[]; 
  public optionalActions!: TaskAction[]; // Can be empty
  public assignedGroups!: Group[]; 
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

