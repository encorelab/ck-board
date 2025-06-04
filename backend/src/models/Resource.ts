// backend/src/models/Resource.ts

import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { collection: 'resources', timestamps: true } })
export class ResourceModel { 
  @prop({ required: true, unique: true }) // Assuming resourceID should be unique
  public resourceID!: string;

  @prop({ required: true })
  public name!: string;

  @prop({ required: true, index: true }) // Indexing activityID can be useful
  public activityID!: string;

  @prop({ required: true, default: 0 })
  public order!: number;

  @prop({ required: true, default: false })
  public canvas!: boolean;

  @prop({ required: true, default: false })
  public bucketView!: boolean;

  @prop({ required: true, default: false })
  public workspace!: boolean;

  @prop({ required: true, default: false })
  public monitor!: boolean;

  @prop({ required: true, default: false })
  public ideaAgent!: boolean;

  @prop({ required: true, type: () => [String], default: [] })
  public groupIDs!: string[];
}

const ResourceMongooseModel = getModelForClass(ResourceModel); // The Mongoose model instance
export default ResourceMongooseModel; // Default export is the Mongoose model

export { ResourceModel as ResourceClass };
