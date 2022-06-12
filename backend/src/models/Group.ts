import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { collection: "groups", timestamps: true } })
export class GroupModel {
  @prop({ required: true })
  public groupID!: string;

  @prop({ required: true })
  public projectID!: string;

  @prop({ required: true })
  public name!: string;

  @prop({ required: true })
  public members!: string[];
}

export default getModelForClass(GroupModel);
