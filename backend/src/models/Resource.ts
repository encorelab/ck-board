// backend/src/models/Resource.ts

import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { collection: 'resources', timestamps: true } })
export class ResourceModel {
  @prop({ required: true })
  public resourceID!: string;

  @prop({ required: true })
  public activityID!: string; 

  @prop({ required: true })
  public order!: number; 

  @prop({ required: true, default: false })
  public canvas!: boolean;

  @prop({ required: true, default: false })
  public bucketView!: boolean;

  @prop({ required: true, default: false })
  public workspace!: boolean;

  @prop({ required: true, default: false })
  public monitor!: boolean;

  // ... add more properties for future resource types as needed ...
}

const Resource = getModelForClass(ResourceModel);
export default Resource;