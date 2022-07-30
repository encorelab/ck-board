export class Group {
  groupID: string;
  projectID: string;

  name: string;
  members: string[];
}

export class User {
  userID: string;
  email: string;
  password: string;
  username: string;
  role: Role;
}

export enum Role {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}
