import { Server, Socket } from 'socket.io';
import { SocketEvent } from '../../constants';
import {
  NotificationModel,
  BoardNotificationModel,
  ProjectNotificationModel,
  NotificationType,
} from '../../models/Notification';
import dalNotification from '../../repository/dalNotification';
import SocketManager from '../socketManager';
import { SocketPayload } from '../types/event.types';

class NotificationCreate {
  static type: SocketEvent = SocketEvent.NOTIFICATION_CREATE;

  static async handleEvent(
    input: SocketPayload<BoardNotificationModel | ProjectNotificationModel>
  ): Promise<BoardNotificationModel | ProjectNotificationModel> {
    const notification = await dalNotification.create(
      input.eventData.type,
      input.eventData
    );
    return notification;
  }

  static async handleResult(
    io: Server,
    socket: Socket,
    notification: BoardNotificationModel | ProjectNotificationModel
  ) {
    const id = SocketManager.Instance.get(notification.userID);
    if (id) {
      if (notification.type === NotificationType.BOARD) {
        socket.broadcast
          .to(id)
          .emit(SocketEvent.BOARD_NOTIFICATION_CREATE, notification);
      } else if (notification.type === NotificationType.PROJECT)
        socket.broadcast
          .to(id)
          .emit(SocketEvent.PROJECT_NOTIFICATION_CREATE, notification);
    }
  }
}

const notificationEvents = [NotificationCreate];

export default notificationEvents;
