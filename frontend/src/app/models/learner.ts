import { AuthUser } from './user';

export enum DimensionType {
  DIAGNOSTIC = 'Diagnostic',
  REASSESSMENT = 'Re-assessment',
}

export class LearnerModel {
  modelID: string;
  projectID: string;
  boardID?: string;
  name: string;

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
