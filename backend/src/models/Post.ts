import { prop, Ref, getModelForClass, modelOptions } from '@typegoose/typegoose';
import {TagModel} from './Tag';

@modelOptions({ schemaOptions: { collection: 'posts' } })
export class PostModel {
  @prop({ required: true })
  public postID!: string;

  @prop({ required: true })
  public userID!: string;

  @prop({ required: true })
  public title!: string;

  @prop({ required: true })
  public desc!: string;

  @prop({ required: true, type: () => [TagModel] })
  public tags!: TagModel[];

  @prop()
  public fabricObject?: string;
}

export default getModelForClass(PostModel);