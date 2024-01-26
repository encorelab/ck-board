import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import { TagModel } from './Tag';

export enum ContentType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  OPEN_RESPONSE_MESSAGE = 'OPEN_RESPONSE_MESSAGE',
}

export enum PostType {
  BOARD = 'BOARD',
  BUCKET = 'BUCKET',
  LIST = 'LIST',
  WORKFLOW = 'WORKFLOW',
}

export class MultipleChoiceOptions {
  @prop({ required: true })
  public optionTitle!: string;

  @prop({ required: true })
  public correct!: boolean;

  @prop({ required: false })
  public formuala?: boolean;
}

export class Position {
  @prop({ required: true })
  public left!: number;

  @prop({ required: true })
  public top!: number;
}

export class DisplayAttributes {
  @prop({ required: false, type: () => Position })
  public position?: Position;

  @prop({ required: false })
  public lock?: boolean;

  @prop({ required: false })
  public borderWidth?: number;

  @prop({ required: false })
  public borderColor?: string;

  @prop({ required: true })
  public fillColor!: string;

  @prop({ required: false })
  public opacity?: number;
}

@modelOptions({ schemaOptions: { collection: 'posts', timestamps: true } })
export class PostModel {
  @prop({ required: true })
  public postID!: string;

  @prop({ required: true })
  public userID!: string;

  @prop({ required: true })
  public boardID!: string;

  @prop({ enum: PostType, type: String, required: true })
  public type!: PostType;

  @prop({ enum: ContentType, type: String, required: true })
  public contentType!: ContentType;

  @prop({ required: true })
  public title!: string;

  @prop({ required: false })
  public desc?: string;

  @prop({ required: false, type: () => [MultipleChoiceOptions] })
  public multipleChoice?: MultipleChoiceOptions[];

  @prop({ required: true })
  public author!: string;

  @prop({ required: true, type: () => [TagModel] })
  public tags!: TagModel[];

  @prop({ required: true, type: () => DisplayAttributes })
  public displayAttributes!: DisplayAttributes;
}

export default getModelForClass(PostModel);
