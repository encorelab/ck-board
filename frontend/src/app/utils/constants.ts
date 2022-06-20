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

  POST_LIKE_ADD = 'POST_LIKE_ADD',
  POST_LIKE_REMOVE = 'POST_LIKE_REMOVE',

  POST_COMMENT_ADD = 'POST_COMMENT_ADD',

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

  WORKFLOW_RUN_DISTRIBUTION = 'WORKFLOW_RUN_DISTRIBUTION',

  NOTIFICATION_CREATE = 'NOTIFICATION_CREATE',
}

export const POST_COLOR = '#FFE663';

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
