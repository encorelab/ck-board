import { prop, getModelForClass, modelOptions, Severity } from '@typegoose/typegoose';
import { BgImageModel } from './Board';

export class PersonalBoardSetting {
  @prop({ required: true })
  public enabled!: boolean;

  @prop({ required: false, type: () => BgImageModel, _id: false })
  public bgImage?: BgImageModel;
}

@modelOptions({
  schemaOptions: { collection: 'projects', timestamps: true },
  options: { allowMixed: Severity.ALLOW }
})
export class ProjectModel {
  @prop({ required: true, unique: true })
  public projectID!: string;

  @prop({ required: true, default: false })
  public isScoreRun!: boolean;

  @prop({ required: true, type: () => [String], default: [] })
  public teacherIDs!: string[];

  @prop({ required: true })
  public name!: string;

  @prop({ required: true, type: () => [String], default: [] })
  public members!: string[];

  @prop({ required: true, type: () => [String], default: [] })
  public groups!: string[];

  @prop({ required: true, type: () => [String], default: [] })
  public boards!: string[];

  @prop({ required: true })
  public studentJoinCode!: string;

  @prop({ required: true })
  public teacherJoinCode!: string;

  @prop({ required: true, type: () => PersonalBoardSetting, _id: false })
  public personalBoardSetting!: PersonalBoardSetting;

  @prop({ required: true, default: false })
  public membershipDisabled!: boolean;
}

export default getModelForClass(ProjectModel);
