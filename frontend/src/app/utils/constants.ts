import { Tag } from '../models/tag';

export enum Mode {
  PAN,
  EDIT,
  CHOOSING_LOCATION,
}

export enum SocketEvent {
  POST_CREATE = 'POST_CREATE',
  POST_UPDATE = 'POST_UPDATE',
  POST_DELETE = 'POST_DELETE',

  POST_UPVOTE_ADD = 'POST_UPVOTE_ADD',
  POST_UPVOTE_REMOVE = 'POST_UPVOTE_REMOVE',

  POST_COMMENT_ADD = 'POST_COMMENT_ADD',
  POST_COMMENT_REMOVE = 'POST_COMMENT_REMOVE',

  POST_TAG_ADD = 'POST_TAG_ADD',
  POST_TAG_REMOVE = 'POST_TAG_REMOVE',

  POST_START_MOVE = 'POST_START_MOVE',
  POST_STOP_MOVE = 'POST_STOP_MOVE',

  POST_READ = 'POST_READ',

  BUCKET_ADD_POST = 'BUCKET_ADD_POST',
  BUCKET_REMOVE_POST = 'BUCKET_REMOVE_POST',

  BOARD_NAME_UPDATE = 'BOARD_NAME_UDPATE',
  BOARD_IMAGE_UPDATE = 'BOARD_IMAGE_UPDATE',
  BOARD_PERMISSIONS_UPDATE = 'BOARD_PERMISSIONS_UPDATE',
  BOARD_TASK_UPDATE = 'BOARD_TASK_UPDATE',
  BOARD_TAGS_UPDATE = 'BOARD_TAGS_UPDATE',
  BOARD_UPVOTE_UPDATE = 'BOARD_UPVOTE_UPDATE',
  BOARD_CLEAR = 'BOARD_CLEAR',
  BOARD_CONN_UPDATE = 'BOARD_CONN_UPDATE',

  PERSONAL_BOARD_ADD_POST = 'PERSONAL_BOARD_ADD_POST',

  VOTES_CLEAR = 'VOTES_CLEAR',

  WORKFLOW_RUN_DISTRIBUTION = 'WORKFLOW_RUN_DISTRIBUTION',
  WORKFLOW_RUN_TASK = 'WORKFLOW_RUN_TASK',
  WORKFLOW_PROGRESS_UPDATE = 'WORKFLOW_PROGRESS_UPDATE',
  WORKFLOW_POST_SUBMIT = 'WORKFLOW_POST_SUBMIT',

  NOTIFICATION_CREATE = 'NOTIFICATION_CREATE',
  BOARD_NOTIFICATION_CREATE = 'BOARD_NOTIFICATION_CREATE',
  PROJECT_NOTIFICATION_CREATE = 'PROJECT_NOTIFICATION_CREATE',
  TRACING_ENABLED = 'TRACING_ENABLED',
  TRACING_DISABLED = 'TRACING_DISABLED',
}

export const STUDENT_POST_COLOR = '#FFF7C0';
export const TEACHER_POST_COLOR = '#BBC4F7';

export const POST_DEFAULT_OPACITY = 1;
export const POST_DEFAULT_BORDER = 'black';
export const POST_DEFAULT_BORDER_THICKNESS = 2;

export const POST_TAGGED_BORDER_THICKNESS = 4;

export const POST_MOVING_FILL = '#999999';
export const POST_MOVING_OPACITY = 0.5;

export const IDEA_TAG: Partial<Tag> = {
  name: 'Idea',
  color: '#5bc2cb',
};
export const QUESTION_TAG: Partial<Tag> = {
  name: 'Question',
  color: '#e6a129',
};
export const NEEDS_ATTENTION_TAG: Partial<Tag> = {
  name: 'Needs Attention',
  color: '#f8391d',
  specialAttributes: {
    borderColor: '#f8391d',
    borderWidth: POST_TAGGED_BORDER_THICKNESS,
  },
};

export const DEFAULT_TAGS: Partial<Tag>[] = [
  IDEA_TAG,
  QUESTION_TAG,
  NEEDS_ATTENTION_TAG,
];

export const TAG_DEFAULT_COLOR = '#c5c2b5';

export enum TODOITEM_NOTIFICATION {
  INITIAL = 'INITIAL',
  SECONDARY = 'SECONDARY',
  OVERDUE = 'OVERDUE',
}

export enum EXPANDED_TODO_TYPE {
  COGNITION = 'Content learning',
  SEL = 'Social-emotional learning',
  BEHAVIOURAL = 'Classroom engagement',
  CLASS = 'Assigned class work',
}

export enum EXPANDED_COMPLETION_QUALITY {
  N_A = 'In-progress',
  INCOMPLETE = 'Incomplete',
  VERY_UNSATISFIED = 'Poor',
  UNSATISFIED = 'Low',
  NEUTRAL = 'Moderate',
  SATISFIED = 'Good',
  VERY_SATISFIED = 'Excellent',
}

export enum TODO_TYPE_COLORS {
  COGNITION = '#5bc2cb',
  SEL = '#f67280',
  BEHAVIOURAL = '#e6a129',
  CLASS = '#88B04B',
}

export const TODO_TITLE_MAX_LENGTH = 100;
