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
  
  POST_NEEDS_ATTENTION_TAG = 'POST_NEEDS_ATTENTION_TAG',
  POST_NO_TAG = 'POST_NO_TAG',

  BOARD_NAME_UDPATE = 'BOARD_NAME_UDPATE',
  BOARD_IMAGE_UPDATE = 'BOARD_IMAGE_UPDATE',
  BOARD_PERMISSIONS_UPDATE = 'BOARD_PERMISSIONS_UPDATE',
  BOARD_TASK_UPDATE = 'BOARD_TASK_UPDATE',
  BOARD_TAGS_UPDATE = 'BOARD_TAGS_UPDATE',
}