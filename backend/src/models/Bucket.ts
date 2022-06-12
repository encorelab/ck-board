import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { collection: "buckets", timestamps: true } })
export class BucketModel {
  @prop({ required: true })
  public bucketID!: string;

  @prop({ required: true })
  public boardID!: string;

  @prop({ required: true })
  public name!: string;

  @prop({ required: true })
  public posts!: string[];
}

export default getModelForClass(BucketModel);
