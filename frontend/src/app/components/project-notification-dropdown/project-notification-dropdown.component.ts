import { Component, OnInit, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AuthUser } from 'src/app/models/user';
import { Project } from 'src/app/models/project';
import { SocketService } from 'src/app/services/socket.service';
import { SocketEvent } from 'src/app/utils/constants';
import { NotificationService } from 'src/app/services/notification.service';
import {
  NotificationType,
  ProjectNotification,
} from 'src/app/models/notification';

@Component({
  selector: 'app-project-notification-dropdown',
  templateUrl: './project-notification-dropdown.component.html',
  styleUrls: ['./project-notification-dropdown.component.scss'],
})
export class ProjectNotificationDropdownComponent implements OnInit {
  @Input() user: AuthUser;
  @Input() project: Project;

  notifications: ProjectNotification[] = [];
  unsubListeners: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    private socketService: SocketService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.notificationService
      .getByUserAndProject(this.user.userID, this.project.projectID)
      .then((notifications) => {
        this.notifications = notifications;
        this.initGroupEventsListener();
      });
  }

  initGroupEventsListener() {
    const unsub = this.socketService.listen(
      SocketEvent.PROJECT_NOTIFICATION_CREATE,
      this.handleAdd
    );
    this.unsubListeners.push(unsub);
  }

  handleAdd = (notification: ProjectNotification) => {
    this.notifications.push(notification);
  };

  async markAllAsRead() {
    this.notifications.forEach((notification) => {
      this.notificationService.markAsRead(
        NotificationType.PROJECT,
        notification.notificationID
      );
      this.deleteNotification(notification);
    });
  }

  deleteNotification(notification: ProjectNotification) {
    if (this.notifications) {
      this.notifications = this.notifications.filter(
        (currentNotification) =>
          currentNotification.notificationID != notification.notificationID
      );
    }
    this.notificationService.remove(
      NotificationType.PROJECT,
      notification.notificationID
    );
  }

  ngOnDestroy(): void {
    this.notifications = [];
    this.unsubListeners.forEach((unsub) => unsub.unsubscribe());
  }
}
