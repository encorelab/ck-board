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

export class Board {
  projectID: string;
  boardID: string;
  teacherID: string;
  name: string;
  task: BoardTask;
  bgImage: BoardBackgroundImage | null;
  permissions: BoardPermissions;
  members: string[];
  tags: Tag[];
  initialZoom = 100;
  upvoteLimit = 5;
}
