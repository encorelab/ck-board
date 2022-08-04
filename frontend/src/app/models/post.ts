import { Tag } from './tag';

export class DisplayAttributes {
  position?: {
    left: number;
    top: number;
  };
  lock?: boolean;
  borderWidth?: number;
  borderColor?: string;
  fillColor?: string;
  opacity?: number;
}

export enum PostType {
  BOARD = 'BOARD',
  BUCKET = 'BUCKET',
}

export default class Post {
  postID: string;
  userID: string;
  boardID: string;

  type: PostType;

  title: string;
  desc: string;
  author: string;
  tags: Tag[];

  displayAttributes: DisplayAttributes | null;
}
