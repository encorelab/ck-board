import { Tag } from "../models/post";

export enum Mode {
    PAN,
    EDIT,
    CHOOSING_LOCATION
}

export enum SocketEvent {
    POST_CREATE = 'POST_CREATE',
    POST_UPDATE = 'POST_UPDATE',
    POST_DELETE = 'POST_DELETE',

    POST_LIKE_ADD = 'POST_LIKE_ADD',
    POST_LIKE_REMOVE = 'POST_LIKE_REMOVE',
    POST_COMMENT_ADD = 'POST_COMMENT_ADD',

    POST_START_MOVE = 'POST_START_MOVE',
    POST_STOP_MOVE = 'POST_STOP_MOVE',

    POST_LOCK = 'POST_LOCK',
    POST_NEEDS_ATTENTION_TAG = 'POST_NEEDS_ATTENTION_TAG',
    POST_NO_TAG = 'POST_NO_TAG',

    BOARD_NAME_UPDATE = 'BOARD_NAME_UDPATE',
    BOARD_IMAGE_UPDATE = 'BOARD_IMAGE_UPDATE',
    BOARD_PERMISSIONS_UPDATE = 'BOARD_PERMISSIONS_UPDATE',
    BOARD_TASK_UPDATE = 'BOARD_TASK_UPDATE',
    BOARD_TAGS_UPDATE = 'BOARD_TAGS_UPDATE',
}

export enum CanvasPostEvent {
    TITLE_CHANGE,            // change post title
    DESC_CHANGE,             // change post description
    
    LIKE,                    // like a post
    COMMENT,                 // comment on a post

    START_MOVE,              // start to move a post
    STOP_MOVE,               // post dropped
    LOCK,                    // lock a post 

    NEEDS_ATTENTION_TAG,     // update to red border,
    NO_TAG,                  // no tags (remove all tag-specific modifications)

    NONE,                    // no event
}

export enum Role {
    STUDENT = "student",
    TEACHER = "teacher"
}

export const POST_COLOR: string = '#FFE663';
export const POST_DEFAULT_OPACITY: number = 1;
export const POST_DEFAULT_BORDER: string = 'black';

export const POST_DEFAULT_BORDER_THICKNESS: number = 2;
export const POST_TAGGED_BORDER_THICKNESS: number = 4;

export const POST_MOVING_FILL: string = '#999999';
export const POST_MOVING_OPACITY: number = 0.5;

export const IDEA_TAG: Tag = {name: 'Idea', color: '#5bc2cb'};
export const QUESTION_TAG: Tag = {name: 'Question', color: '#e6a129'};
export const NEEDS_ATTENTION_TAG: Tag = {name: 'Needs Attention', color: '#f8391d'};

export const DEFAULT_TAGS: Tag[] = [IDEA_TAG, QUESTION_TAG, NEEDS_ATTENTION_TAG];

export const TAG_DEFAULT_COLOR = '#c5c2b5';
