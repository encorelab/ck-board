import { Tag } from "../models/post";

export enum Mode {
    PAN,
    EDIT,
    CHOOSING_LOCATION
}

export enum CanvasPostEvent {
    TITLE_CHANGE,   // change post title
    DESC_CHANGE,    // change post description
    LIKE,           // like a post
    COMMENT,        // comment on a post
    START_MOVE,     // start to move a post
    STOP_MOVE,      // post dropped
    LOCK,           // lock a post 
    NONE,           // no event
}

export enum Role {
    STUDENT = "student",
    TEACHER = "teacher"
}

export const POST_COLOR: string = '#FFE663';
export const POST_MOVING_BORDER: string = '#999999';
export const POST_DEFAULT_BORDER: string = 'black';

export const DEFAULT_TAGS: Tag[] = [
    {name: 'Idea', color: '#5bc2cb'},
    {name: 'Question', color: '#e6a129'},
    {name: 'Needs Attention', color: '#f8391d'}
]
export const TAG_DEFAULT_COLOR = '#c5c2b5';
