import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { Board } from 'src/app/models/board';
import Notification from 'src/app/models/notification';
import User, { AuthUser } from 'src/app/models/user';
import { NotificationService } from 'src/app/services/notification.service';
import { PostService } from 'src/app/services/post.service';
import { SocketService } from 'src/app/services/socket.service';
import { SocketEvent } from 'src/app/utils/constants';
import { PostModalComponent } from '../post-modal/post-modal.component';

@Component({
  selector: 'app-notification-dropdown',
  templateUrl: './notification-dropdown.component.html',
  styleUrls: ['./notification-dropdown.component.scss'],
})
export class NotificationDropdownComponent implements OnInit, OnDestroy {
  @Input() user: AuthUser;
  @Input() board: Board;

  notifications: Notification[] = [];
  unsubListeners: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    private postService: PostService,
    private socketService: SocketService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.notificationService
      .getByUserAndBoard(this.user.userID, this.board.boardID)
      .then((notifications) => {
        this.notifications = notifications;
        this.initGroupEventsListener();
      });
  }

  initGroupEventsListener() {
    const unsub = this.socketService.listen(
      SocketEvent.NOTIFICATION_CREATE,
      this.handleAdd
    );
    this.unsubListeners.push(unsub);
  }

  handleAdd = (notification: Notification) => {
    this.notifications.push(notification);
  };

  async openPost(notification: Notification) {
    if (notification.postID) {
      const post = await this.postService.get(notification.postID);
      this.dialog.open(PostModalComponent, {
        minWidth: '700px',
        width: 'auto',
        data: {
          user: this.user,
          post: post,
          board: this.board,
        },
      });

      await this.notificationService.markAsRead(notification.notificationID);
      this.deleteNotification(notification);
    }
  }

  async markAllAsRead() {
    this.notifications.forEach((notification) => {
      this.notificationService.markAsRead(notification.notificationID);
      this.deleteNotification(notification);
    });
  }

  deleteNotification(notification: Notification) {
    if (this.notifications) {
      this.notifications = this.notifications.filter(
        (currentNotification) =>
          currentNotification.notificationID != notification.notificationID
      );
    }
    this.notificationService.remove(notification.notificationID);
  }

  ngOnDestroy(): void {
    this.notifications = [];
    this.unsubListeners.forEach((unsub) => unsub.unsubscribe());
  }
}
