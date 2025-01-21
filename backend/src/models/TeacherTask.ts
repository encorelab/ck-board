// backend/src/models/TeacherTask.ts

import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { collection: 'teacher-tasks', timestamps: true } })
export class TeacherTaskModel {
  @prop({ required: true })
  public taskID!: string;

  @prop({ required: true })
  public name!: string;

  @prop({ required: true })
  public activityID!: string; 

  @prop({ required: true })
  public order!: number;

  @prop({ required: true })
  public type!: string; 

  @prop({ required: false }) 
  public workflowID?: string;

  @prop({ required: false })
  public aiAgentID?: string; 

  @prop({ required: false })
  public customPrompt?: string; 

  // ... add more properties for different task types as needed ...
}

const TeacherTask = getModelForClass(TeacherTaskModel);
export default TeacherTask;