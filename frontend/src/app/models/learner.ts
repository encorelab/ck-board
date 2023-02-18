import { AuthUser } from './user';

export enum LearnerModelType {
  ENGAGEMENT = 'ENGAGEMENT',
}

export enum DimensionType {
  DIAGNOSTIC = 'Diagnostic',
  REASSESSMENT = 'Re-assessment',
}

export class LearnerModel {
  modelID: string;
  boardID: string;
  type: LearnerModelType;

  dimensions: string[]; // name of dimensions, must be unique
  data: DimensionValue[]; // map student to list of dimensions with values
}

export class DimensionValue {
  student: AuthUser;
  dimension: string; // name of dimension

  diagnostic: number;
  reassessment: number;
}

export default LearnerModel;
