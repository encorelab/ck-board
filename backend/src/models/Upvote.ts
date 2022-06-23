import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { collection: 'upvotes', timestamps: true } })
export class UpvoteModel {
  @prop({ required: true })
  public upvoteID!: string;

  @prop({ required: true })
  public postID!: string;

  @prop({ required: true })
  public boardID!: string;

  @prop({ required: true })
  public voterID!: string;
}

export default getModelForClass(UpvoteModel);
