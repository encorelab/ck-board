import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import { TagModel } from './Tag';

export enum PostType {
  BOARD = 'BOARD',
  BUCKET = 'BUCKET',
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

  @prop({ required: false })
  public fillColor?: string;

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

  @prop({ required: true })
  public title!: string;

  @prop({ required: false })
  public desc?: string;

  @prop({ required: true })
  public author!: string;

  @prop({ required: true, type: () => [TagModel] })
  public tags!: TagModel[];

  @prop({ required: false, type: () => DisplayAttributes })
  public displayAttributes?: DisplayAttributes;
}

export default getModelForClass(PostModel);
