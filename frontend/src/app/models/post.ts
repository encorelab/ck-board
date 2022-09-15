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

export class MultipleChoiceOptions {
  optionTitle!: string;
  correct!: boolean;
  formula?: boolean;
}

export enum QuestionAuthoringType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  OPEN_RESPONSE = 'OPEN_RESPONSE',
}

export enum PostType {
  BOARD = 'BOARD',
  BUCKET = 'BUCKET',
  LIST = 'LIST',
}

export default class Post {
  postID: string;
  userID: string;
  boardID: string;

  type: PostType;
  questionAuthoringType: QuestionAuthoringType;
  title: string;
  desc: string;
  multipleChoice?: MultipleChoiceOptions[];
  author: string;
  tags: Tag[];

  displayAttributes: DisplayAttributes | null;
}
