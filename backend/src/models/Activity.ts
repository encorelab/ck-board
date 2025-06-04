import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { collection: 'activities', timestamps: true } })
export class ActivityModel {
  @prop({ required: true, unique: true }) // Assuming activityID should be unique
  public activityID!: string;

  @prop({ required: true }) 
  public name!: string;

  @prop({ required: true, index: true }) // Indexing projectID can be useful
  public projectID!: string;

  @prop({ required: true })
  public boardID!: string;

  @prop({ required: true, type: () => [String], default: [] }) // Default to empty array
  public groupIDs!: string[];

  @prop({ required: true, default: 0 })
  public order!: number;

  @prop({ required: false, default: false }) // Added isActive property
  public isActive?: boolean;
}

const Activity = getModelForClass(ActivityModel);
export default Activity;
 