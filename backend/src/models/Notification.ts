import {
  prop,
  getModelForClass,
  modelOptions,
  getDiscriminatorModelForClass,
} from '@typegoose/typegoose';

export enum NotificationType {
  BOARD = 'BOARD',
  PROJECT = 'PROJECT',
}

@modelOptions({
  schemaOptions: { collection: 'notifications', timestamps: true },
})
export class NotificationModel {
  @prop({ required: true })
  public notificationID!: string;

  @prop({ required: true })
  public userID!: string;

  @prop({ enum: NotificationType, required: true })
  public type!: NotificationType;

  @prop({ required: true })
  public text!: string;

  @prop({ required: true })
  public viewed!: boolean;
}

export class BoardNotificationModel extends NotificationModel {
  @prop({ required: true })
  public boardID!: string;

  @prop({ required: true })
  public postID!: string;
}

export class ProjectNotificationModel extends NotificationModel {
  @prop({ required: true })
  public projectID!: string;
}

export const Notification = getModelForClass(NotificationModel);
export const BoardNotification = getDiscriminatorModelForClass(
  Notification,
  BoardNotificationModel,
  NotificationType.BOARD
);
export const ProjectNotification = getDiscriminatorModelForClass(
  Notification,
  ProjectNotificationModel,
  NotificationType.PROJECT
);
