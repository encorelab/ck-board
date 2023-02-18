import {
  prop,
  getModelForClass,
  modelOptions,
  Ref,
  plugin,
} from '@typegoose/typegoose';
import { UserModel } from './User';
import * as autopopulate from 'mongoose-autopopulate';

export enum LearnerModelType {
  ENGAGEMENT = 'ENGAGEMENT',
}

@plugin(autopopulate.default)
@modelOptions({
  schemaOptions: { collection: 'learnerModels', timestamps: true },
})
export class LearnerModelModel {
  @prop({ required: true })
  public modelID!: string;

  @prop({ required: true })
  public projectID!: string;

  @prop({ required: true })
  public boardID!: string;

  @prop({ enum: LearnerModelType, type: String, required: true })
  public type!: LearnerModelType;

  @prop({ required: true, unique: true })
  public dimensions!: string[];

  @prop({ required: true, type: () => [DimensionValue] })
  public data!: DimensionValue[];
}

export class DimensionValue {
  @prop({ ref: () => UserModel, autopopulate: true })
  public student!: Ref<UserModel>;

  @prop({ required: true })
  public dimension!: string;

  @prop({ required: true, min: 0, max: 100 })
  public diagnostic!: number;

  @prop({ required: true, min: 0, max: 100 })
  public reassessment!: number;
}

export default getModelForClass(LearnerModelModel);
