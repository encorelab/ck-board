import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import { BgImageModel } from './Board';

export class PersonalBoardSetting {
  @prop({ required: true })
  public enabled!: boolean;

  @prop({ required: false, type: () => BgImageModel })
  public bgImage?: BgImageModel;
}

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

  @prop({ required: true, type: () => PersonalBoardSetting })
  public personalBoardSetting!: PersonalBoardSetting;
}

export default getModelForClass(ProjectModel);
