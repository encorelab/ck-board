import AuthUser from "./user";

export class Group {
  groupID: string;
  projectID: string;

  name: string;
  members: string[];
}

export class GroupMembers {
  groupID: string;
  groupName: string;
  members: AuthUser[];
}