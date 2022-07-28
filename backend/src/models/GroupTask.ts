import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import { TaskAction } from './Workflow';

export enum GroupTaskStatus {
  INACTIVE = 'INACTIVE',
  ACTIVE = 'ACTIVE',
  COMPLETE = 'COMPLETE',
}

@modelOptions({ schemaOptions: { collection: 'groupTasks', timestamps: true } })
export class GroupTaskModel {
  @prop({ required: true })
  public groupTaskID!: string;

  @prop({ required: true })
  public groupID!: string;

  @prop({ required: true })
  public workflowID!: string;

  @prop({ required: true })
  public posts!: string[];
  
  @prop({ required: true })
  public actions!: TaskAction[];

  @prop({ enum: GroupTaskStatus, type: String, required: true })
  public status!: GroupTaskStatus;
}

export default getModelForClass(GroupTaskModel);
