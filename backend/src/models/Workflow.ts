import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";

export enum DestinationType {
  BOARD = "BOARD",
  BUCKET = "BUCKET",
}

export class Destination {
  @prop({ enum: DestinationType, type: String, required: true })
  public type!: DestinationType;

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

  @prop({ required: true, type: () => Destination })
  public source!: Destination;

  @prop({ required: true, type: () => [Destination] })
  public destinations!: Destination[];

  @prop({ required: true })
  public postsPerDestination!: number;
}

export default getModelForClass(WorkflowModel);