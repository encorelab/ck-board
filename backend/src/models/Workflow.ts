import {
  prop,
  getModelForClass,
  modelOptions,
  getDiscriminatorModelForClass,
} from "@typegoose/typegoose";

export enum WorkflowType {
  DISTRIBUTION = "DISTRIBUTION",
}

export enum ContainerType {
  BOARD = "BOARD",
  BUCKET = "BUCKET",
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

export const Workflow = getModelForClass(WorkflowModel);
export const DistributionWorkflow = getDiscriminatorModelForClass(
  Workflow,
  DistributionWorkflowModel,
  WorkflowType.DISTRIBUTION
);
