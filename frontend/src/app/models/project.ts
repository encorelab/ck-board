import { BoardBackgroundImage } from './board';

export class PersonalBoardSetting {
  enabled: boolean;
  bgImage: BoardBackgroundImage | null;
}

export class Project {
  projectID: string;
  teacherID: string;
  name: string;
  boards: string[];
  members: string[];
  joinCode: string;
  personalBoardSetting: PersonalBoardSetting;
}
