import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { collection: "likes", timestamps: true } })
export class LikeModel {
  @prop({ required: true })
  public likeID!: string;

  @prop({ required: true })
  public postID!: string;

  @prop({ required: true })
  public boardID!: string;

  @prop({ required: true })
  public likerID!: string;
}

export default getModelForClass(LikeModel);
