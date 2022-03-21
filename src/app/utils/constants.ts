import { Tag } from "../models/post";

export enum Mode {
    PAN,
    EDIT,
    CHOOSING_LOCATION
}

export enum Role {
    STUDENT = "student",
    TEACHER = "teacher"
}

export const POST_COLOR: string = '#FFE663';

export const DEFAULT_TAGS: Tag[] = [
    {name: 'Idea', color: '#5bc2cb'},
    {name: 'Question', color: '#e6a129'},
    {name: 'Needs Attention', color: '#f8391d'}
]
export const TAG_DEFAULT_COLOR = '#c5c2b5';
