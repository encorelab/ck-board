import {
  NotificationModel,
  Notification,
  BoardNotification,
  ProjectNotification,
  BoardNotificationModel,
  ProjectNotificationModel,
  NotificationType,
} from '../models/Notification';

export const getByUserAndBoard = async (user: string, board: string) => {
  try {
    const notifications = await BoardNotification.find({
      userID: user,
      boardID: board,
    });
    return notifications;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const getByUserAndProject = async (user: string, project: string) => {
  try {
    const notifications = await ProjectNotification.find({
      userID: user,
      projectID: project,
    });
    return notifications;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const create = async (
  type: NotificationType,
  notification: BoardNotificationModel | ProjectNotificationModel
) => {
  try {
    if (type === NotificationType.BOARD) {
      const savedNotification = await BoardNotification.create(notification);
      return savedNotification;
    } else {
      const savedNotification = await ProjectNotification.create(notification);
      return savedNotification;
    }
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const update = async (
  type: NotificationType,
  id: string,
  notification: Partial<BoardNotificationModel | ProjectNotificationModel>
) => {
  try {
    if (type === NotificationType.BOARD) {
      const updatedNotification = await BoardNotification.findOneAndUpdate(
        { notificationID: id },
        notification,
        {
          new: true,
        }
      );
      return updatedNotification;
    } else if (type === NotificationType.PROJECT) {
      const updatedNotification = await ProjectNotification.findOneAndUpdate(
        { notificationID: id },
        notification,
        {
          new: true,
        }
      );
      return updatedNotification;
    }
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const remove = async (type: NotificationType, id: string) => {
  try {
    if (type === NotificationType.BOARD) {
      return await BoardNotification.findOneAndDelete({ notificationID: id });
    } else if (type === NotificationType.PROJECT) {
      return await ProjectNotification.findOneAndDelete({
        notificationID: id,
      });
    }
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const removeByBoard = async (boardID: string) => {
  try {
    const deletedNotifications = await BoardNotification.deleteMany({
      boardID: boardID,
    });
    return deletedNotifications;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

const dalNotification = {
  getByUserAndBoard,
  getByUserAndProject,
  create,
  update,
  remove,
  removeByBoard,
};

export default dalNotification;
