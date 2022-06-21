import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import { TagModel } from './Tag';

export class TaskModel {
  @prop({ required: false })
  public title?: string;

  @prop({ required: false })
  public message?: string;
}

export class BgImageModel {
  @prop({ required: true })
  public url!: string;

  @prop({ required: false })
  public imgSettings?: unknown;
}

export class PermissionsModel {
  @prop({ required: true })
  public allowStudentMoveAny!: boolean;

  @prop({ required: true })
  public allowStudentLiking!: boolean;

  @prop({ required: true })
  public allowStudentEditAddDeletePost!: boolean;

  @prop({ required: true })
  public allowStudentCommenting!: boolean;

  @prop({ required: true })
  public allowStudentTagging!: boolean;

  @prop({ required: true })
  public showAuthorNameStudent!: boolean;

  @prop({ required: true })
  public showAuthorNameTeacher!: boolean;

  @prop({ required: true })
  public showBucketStudent!: boolean;
}

@modelOptions({ schemaOptions: { collection: 'boards', timestamps: true } })
export class BoardModel {
  @prop({ required: true })
  public boardID!: string;

  @prop({ required: true })
  public teacherID!: string;

  @prop({ required: true })
  public name!: string;

  @prop({ required: true })
  public members!: string[];

  @prop({ required: false, type: () => TaskModel })
  public task?: TaskModel;

  @prop({ required: true, type: () => PermissionsModel })
  public permissions!: PermissionsModel;

  @prop({ required: false, type: () => BgImageModel })
  public bgImage?: BgImageModel;

  @prop({ required: true, type: () => [TagModel] })
  public tags!: TagModel[];

  @prop({ required: true })
  public initialZoom!: number;
}

export default getModelForClass(BoardModel);
