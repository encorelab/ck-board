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

export class DateRange {
  start: Date;
  end: Date;
}

export class ViewSettings {
  allowCanvas: boolean | undefined;
  allowWorkspace: boolean | undefined;
  allowBuckets: boolean | undefined;
  allowMonitor: boolean | undefined;
}

export enum BoardScope {
  PROJECT_SHARED = 'PROJECT_SHARED',
  PROJECT_PERSONAL = 'PROJECT_PERSONAL',
}

export enum BoardType {
  BRAINSTORMING = 'BRAINSTORMING',
  QUESTION_AUTHORING = 'QUESTION_AUTHORING',
}

export enum ViewType {
  CANVAS = 'CANVAS',
  WORKSPACE = 'WORKSPACE',
  BUCKETS = 'BUCKETS',
  MONITOR = 'MONITOR',
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
  defaultTodoDateRange: DateRange | null;
  defaultView: ViewType | undefined | null;
  viewSettings: ViewSettings | undefined | null;
}
