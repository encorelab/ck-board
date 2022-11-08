export enum NotificationType {
  BOARD = 'BOARD',
  PROJECT = 'PROJECT',
}

export class Notification {
  notificationID: string;
  text: string;
  viewed: boolean;
  userID: string;
  type: NotificationType;
}

export class BoardNotification extends Notification {
  boardID: string;
  postID: string;
}

export class ProjectNotification extends Notification {
  projectID: string;
}
