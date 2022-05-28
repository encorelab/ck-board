export default class Post {
  postID: string;
  boardID: string;
  title: string;
  desc: string;
  tags: Tag[];
  userID: string;
  fabricObject: string | null;
}

export class TagSpecialAttributes {
  borderWidth?: number;
  borderColor?: string;
  fillColor?: string;
  opacity?: number;
}

export class Tag {
  boardID: string;
  name: string;
  color: string;
  specialAttributes?: TagSpecialAttributes;
}

export enum PostType {
  BOARD,
  BUCKET,
}
