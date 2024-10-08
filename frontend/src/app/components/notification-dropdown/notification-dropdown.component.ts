import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { Subscription } from 'rxjs';
import { Board } from 'src/app/models/board';
import {
  NotificationType,
  BoardNotification,
} from 'src/app/models/notification';
import { AuthUser } from 'src/app/models/user';
import { CanvasService } from 'src/app/services/canvas.service';
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

  notifications: BoardNotification[] = [];
  unsubListeners: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    private postService: PostService,
    private socketService: SocketService,
    public dialog: MatDialog,
    private canvasService: CanvasService
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
      SocketEvent.BOARD_NOTIFICATION_CREATE,
      this.handleAdd
    );
    this.unsubListeners.push(unsub);
  }

  handleAdd = (notification: BoardNotification) => {
    this.notifications.push(notification);
  };

  async openPost(notification: BoardNotification) {
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
      await this.canvasService.readPost(post.postID);
      await this.notificationService.markAsRead(
        NotificationType.BOARD,
        notification.notificationID
      );
      this.deleteNotification(notification);
    }
  }

  async markAllAsRead() {
    this.notifications.forEach((notification) => {
      this.notificationService.markAsRead(
        NotificationType.BOARD,
        notification.notificationID
      );
      this.deleteNotification(notification);
    });
  }

  deleteNotification(notification: BoardNotification) {
    if (this.notifications) {
      this.notifications = this.notifications.filter(
        (currentNotification) =>
          currentNotification.notificationID != notification.notificationID
      );
    }
    this.notificationService.remove(
      NotificationType.BOARD,
      notification.notificationID
    );
  }

  ngOnDestroy(): void {
    this.notifications = [];
    this.unsubListeners.forEach((unsub) => unsub.unsubscribe());
  }
}
