import Notification, { NotificationModel } from '../models/Notification';

export const getByUserAndBoard = async (user: string, board: string) => {
  try {
    const notifications = await Notification.find({
      userID: user,
      boardID: board,
    });
    return notifications;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const create = async (notification: NotificationModel) => {
  try {
    const savedNotification = await Notification.create(notification);
    return savedNotification;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const update = async (
  id: string,
  notification: Partial<NotificationModel>
) => {
  try {
    const updatedNotif = await Notification.findOneAndUpdate(
      { notificationID: id },
      notification,
      {
        new: true,
      }
    );
    return updatedNotif;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const remove = async (id: string) => {
  try {
    return await Notification.findOneAndDelete({ notificationID: id });
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

const dalNotification = {
  getByUserAndBoard,
  create,
  update,
  remove,
};

export default dalNotification;
