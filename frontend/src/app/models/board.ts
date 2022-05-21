import { ImageSettings } from '../utils/FabricUtils';
import { Permissions } from './permissions';
import { Tag } from './post';

export class BoardBackgroundImage {
  url: string;
  imgSettings: ImageSettings;
}

export class BoardTask {
  title: string;
  message?: string;
}

export class Board {
  boardID: string;
  teacherID: string;
  name: string;
  task: BoardTask;
  bgImage: BoardBackgroundImage | null;
  permissions: Permissions;
  members: string[];
  tags: Tag[];
  initialZoom: number = 100;
}
