import { BoardBackgroundImage } from './board';

export class PersonalBoardSetting {
  enabled: boolean;
  bgImage: BoardBackgroundImage | null;
}

export class Project {
  projectID: string;
  isScoreRun: boolean;
  teacherIDs: string[];
  name: string;
  boards: string[];
  members: string[];
  studentJoinCode: string;
  teacherJoinCode: string;
  personalBoardSetting: PersonalBoardSetting;
  membershipDisabled: boolean;
}
