import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { collection: 'groupTasks', timestamps: true } })
export class GroupTaskModel {
  @prop({ required: true })
  public groupTaskID!: string;

  @prop({ required: true })
  public groupID!: string; // is this possible to have required before groups are assigned?

  @prop({ required: true })
  public workflowID!: string;

  @prop({ required: true })
  public posts!: {
    postID: string;
    // memberID: string; // Group members assigned to post
    complete: boolean;
  }[];
}

export default getModelForClass(GroupTaskModel);
