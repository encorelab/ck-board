import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { collection: 'projects', timestamps: true } })
export class ProjectModel {
  @prop({ required: true })
  public projectID!: string;

  @prop({ required: true })
  public teacherID!: string;

  @prop({ required: true })
  public name!: string;

  @prop({ required: true })
  public members!: string[];

  @prop({ required: true })
  public groups!: string[];

  @prop({ required: true })
  public boards!: string[];

  @prop({ required: true })
  public joinCode!: string;
}

export default getModelForClass(ProjectModel);
