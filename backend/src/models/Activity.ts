
import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { collection: 'activities', timestamps: true } })
export class ActivityModel {
  @prop({ required: true })
  public activityID!: string;

  @prop({ required: true })
  public name!: string;

  @prop({ required: true })
  public projectID!: string;

  @prop({ required: true })
  public boardID!: string; 

  @prop({ required: true, type: () => [String] }) 
  public groupIDs!: string[]; 
}

const Activity = getModelForClass(ActivityModel);
export default Activity;