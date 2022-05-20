import Notification, { NotificationModel } from "../models/Notification";

export const getByUser = async (id: string) => {
  try {
    const notifications = await Notification.find({ userID: id });
    return notifications;
  } catch (err) {
    throw new Error("500");
  }
};

export const create = async (notification: NotificationModel) => {
  try {
    const savedNotification = await Notification.create(notification);
    return savedNotification;
  } catch (err) {
    throw new Error("500");
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
    throw new Error("500");
  }
};

export const remove = async (id: string) => {
  try {
    return await Notification.findOneAndDelete({ notificationID: id });
  } catch (err) {
    throw new Error("500");
  }
};

const dalNotification = {
  getByUser,
  create,
  update,
  remove,
};

export default dalNotification;
