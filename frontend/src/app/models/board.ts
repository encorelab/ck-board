import { ImageSettings } from '../utils/FabricUtils';
import { Tag } from './post';

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
  allowStudentLiking: boolean;
  allowStudentEditAddDeletePost: boolean;
  allowStudentCommenting: boolean;
  allowStudentTagging: boolean;
  showAuthorNameStudent: boolean;
  showAuthorNameTeacher: boolean;
  showBucketStudent: boolean;
}

export class Board {
  boardID: string;
  teacherID: string;
  name: string;
  task: BoardTask;
  bgImage: BoardBackgroundImage | null;
  permissions: BoardPermissions;
  members: string[];
  tags: Tag[];
  initialZoom = 100;
}
