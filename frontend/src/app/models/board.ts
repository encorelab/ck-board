import { Permissions } from './permissions';
import { Tag } from './post';

export class Board {
  boardID: string;
  teacherID: string;
  name: string;
  task: {
    title: string;
    message?: string;
  };
  bgImage: {
    url: string;
    imgSettings: {};
  } | null;
  permissions: Permissions;
  members: string[];
  tags: Tag[];
  initialZoom: number = 100;
}
