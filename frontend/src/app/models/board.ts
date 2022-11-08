import { ImageSettings } from '../utils/FabricUtils';
import { Tag } from './tag';

export class BoardBackgroundImage {
  url: string;
  imgSettings: ImageSettings;
}

export class BoardTask {
  title: string;
  message?: string;
}

export class BoardPermissions {
  allowStudentMoveAny: boolean;
  allowStudentUpvoting: boolean;
  allowStudentEditAddDeletePost: boolean;
  allowStudentCommenting: boolean;
  allowStudentTagging: boolean;
  showAuthorNameStudent: boolean;
  showAuthorNameTeacher: boolean;
  showBucketStudent: boolean;
  showSnackBarStudent: boolean;
  allowTracing: boolean;
}

export enum BoardScope {
  PROJECT_SHARED = 'PROJECT_SHARED',
  PROJECT_PERSONAL = 'PROJECT_PERSONAL',
}

export enum BoardType {
  BRAINSTORMING = 'BRAINSTORMING',
  QUESTION_AUTHORING = 'QUESTION_AUTHORING',
}

export class Board {
  projectID: string;
  boardID: string;
  ownerID: string;
  name: string;
  scope: BoardScope;
  task: BoardTask;
  bgImage: BoardBackgroundImage | null;
  permissions: BoardPermissions;
  type: BoardType;
  tags: Tag[];
  initialZoom = 100;
  upvoteLimit = 5;
  visible: boolean;
}
