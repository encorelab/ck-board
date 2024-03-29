import {
  Severity,
  getModelForClass,
  modelOptions,
  prop,
  setGlobalOptions,
} from '@typegoose/typegoose';
import { TagModel } from './Tag';

setGlobalOptions({ options: { allowMixed: Severity.ALLOW } });

export class TaskModel {
  @prop({ required: false })
  public title?: string;

  @prop({ required: false })
  public message?: string;
}

export class ImageSettings {
  @prop({ required: false })
  public top?: number;

  @prop({ required: false })
  public left?: number;

  @prop({ required: false })
  public width?: number;

  @prop({ required: false })
  public height?: number;

  @prop({ required: false })
  public scaleX?: number;

  @prop({ required: false })
  public scaleY?: number;
}

export class BgImageModel {
  @prop({ required: true })
  public url!: string;

  @prop({ required: false })
  public imgSettings?: ImageSettings;
}

export class PermissionsModel {
  @prop({ required: true })
  public allowStudentMoveAny!: boolean;

  @prop({ required: true })
  public allowStudentUpvoting!: boolean;

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

  @prop({ required: true })
  public showSnackBarStudent!: boolean;

  @prop({ required: true })
  public allowTracing!: boolean;
}

export class DateRange {
  @prop({ required: true })
  public start!: Date;

  @prop({ required: true })
  public end!: Date;
}

export class ViewSettings {
  @prop({ required: false })
  public allowCanvas?: boolean;

  @prop({ required: false })
  public allowWorkspace?: boolean;

  @prop({ required: false })
  public allowBuckets?: boolean;

  @prop({ required: false })
  public allowMonitor?: boolean;
}

export enum BoardScope {
  PROJECT_SHARED = 'PROJECT_SHARED',
  PROJECT_PERSONAL = 'PROJECT_PERSONAL',
}

export enum BoardType {
  BRAINSTORMING = 'BRAINSTORMING',
  QUESTION_AUTHORING = 'QUESTION_AUTHORING',
}

export enum ViewType {
  CANVAS = 'CANVAS',
  WORKSPACE = 'WORKSPACE',
  BUCKETS = 'BUCKETS',
  MONITOR = 'MONITOR',
}

@modelOptions({ schemaOptions: { collection: 'boards', timestamps: true } })
export class BoardModel {
  @prop({ required: true })
  public projectID!: string;

  @prop({ required: true })
  public boardID!: string;

  @prop({ required: true })
  public ownerID!: string;

  @prop({ required: true })
  public name!: string;

  @prop({ enum: BoardScope, type: String, required: true })
  public scope!: BoardScope;

  @prop({ required: false, type: () => TaskModel })
  public task?: TaskModel;

  @prop({ required: true, type: () => PermissionsModel })
  public permissions!: PermissionsModel;

  @prop({ enum: BoardType, type: String, required: true })
  public type!: BoardType;

  @prop({ required: false, type: () => BgImageModel })
  public bgImage?: BgImageModel;

  @prop({ required: true, type: () => [TagModel] })
  public tags!: TagModel[];

  @prop({ required: true })
  public initialZoom!: number;

  @prop({ required: true })
  public upvoteLimit!: number;

  @prop({ required: true })
  public visible!: boolean;

  @prop({ required: false })
  public defaultTodoDateRange?: DateRange;

  @prop({ required: false })
  public defaultView?: ViewType;

  @prop({ required: false, type: () => ViewSettings })
  public viewSettings?: ViewSettings;
}

export default getModelForClass(BoardModel);
