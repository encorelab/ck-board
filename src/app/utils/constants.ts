import { Tag } from "../models/post";

export enum Mode {
    PAN,
    EDIT,
    CHOOSING_LOCATION
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
