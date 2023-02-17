import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import { TaskAction } from './Workflow';

export enum LearnerModelType {
  ENGAGEMENT = 'ENGAGEMENT',
}

@modelOptions({
  schemaOptions: { collection: 'learnerModels', timestamps: true },
})
export class LearnerModelModel {
  @prop({ required: true })
  public modelID!: string;

  @prop({ required: true })
  public boardID!: string;

  @prop({ enum: LearnerModelType, type: String, required: true })
  public type!: LearnerModelType;

  @prop({ required: true, unique: true })
  public dimensions!: string[];

  @prop({ required: true, type: () => [TaskAction] })
  public data!: Map<string, DimensionValue[]>;
}

export interface DimensionValue {
  dimension: string;

  diagnostic: number;
  reassessment: number;
}

export default getModelForClass(LearnerModelModel);
