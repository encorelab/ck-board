import { Server, Socket } from "socket.io";
import { SocketEvent } from "../../constants";
import { NotificationModel } from "../../models/Notification";
import dalNotification from "../../repository/dalNotification";
import SocketManager from "../socketManager";

class NotificationCreate {
  static type: SocketEvent = SocketEvent.NOTIFICATION_CREATE;

  static async handleEvent(
    eventData: NotificationModel
  ): Promise<NotificationModel> {
    const notification = await dalNotification.create(eventData);
    return notification;
  }

  static async handleResult(
    io: Server,
    socket: Socket,
    notification: NotificationModel
  ) {
    const id = SocketManager.Instance.get(notification.userID);
    if (id) socket.broadcast.to(id).emit(this.type, notification);
  }
}

const notificationEvents = [NotificationCreate];

export default notificationEvents;
