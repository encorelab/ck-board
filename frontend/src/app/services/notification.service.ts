import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import Notification from '../models/notification';
import Post from '../models/post';
import Utils from '../utils/Utils';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(public http: HttpClient, public userService: UserService) {}

  getNotificationsByUser(userID: string): Promise<Notification[]> {
    return this.http
      .get<Notification[]>('notifications/user/' + userID)
      .toPromise();
  }

  add(notification: Notification): Promise<Notification> {
    return this.http
      .post<Notification>('notifications/', notification)
      .toPromise();
  }

  markAsRead(notificationID: string): Promise<Notification> {
    return this.http
      .post<Notification>('notifications/' + notificationID, { viewed: true })
      .toPromise();
  }

  remove(notificationID: string): Promise<Notification> {
    return this.http
      .delete<Notification>('notifications/' + notificationID)
      .toPromise();
  }

  buildLikeNotification(post: Post) {
    return {
      notificationID: Utils.generateUniqueID(),
      text: this.userService.user?.username + ' liked "' + post.title + '"',
      viewed: false,
      userID: post.userID,
      postID: post.postID,
    };
  }

  buildCommentNotification(post: Post) {
    return {
      notificationID: Utils.generateUniqueID(),
      text:
        this.userService.user?.username + ' commented on "' + post.title + '"',
      viewed: false,
      userID: post.userID,
      postID: post.postID,
    };
  }

  buildTagNotification(post: Post) {
    return {
      notificationID: Utils.generateUniqueID(),
      text: this.userService.user?.username + ' tagged "' + post.title + '"',
      viewed: false,
      userID: post.userID,
      postID: post.postID,
    };
  }
}
