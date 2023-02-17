export enum LearnerModelType {
  ENGAGEMENT = 'ENGAGEMENT',
}

export class LearnerModel {
  modelID: string;
  boardID: string;
  type: LearnerModelType;

  dimensions: string[]; // name of dimensions, must be unique
  data: Map<string, DimensionValue[]>; // map student to list of dimensions with values
}

export interface DimensionValue {
  dimension: string; // name of dimension

  diagnostic: number;
  reassessment: number;
}

export default LearnerModel;
