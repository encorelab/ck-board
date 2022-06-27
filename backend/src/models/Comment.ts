import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { collection: 'comments', timestamps: true } })
export class CommentModel {
  @prop({ required: true })
  public commentID!: string;

  @prop({ required: true })
  public postID!: string;

  @prop({ required: true })
  public boardID!: string;

  @prop({ required: true })
  public author!: string;

  @prop({ required: true })
  public comment!: string;
}

export default getModelForClass(CommentModel);
