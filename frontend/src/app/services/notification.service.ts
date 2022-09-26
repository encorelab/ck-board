import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  NotificationType,
  BoardNotification,
  ProjectNotification,
} from '../models/notification';
import Post from '../models/post';
import { Project } from '../models/project';
import { TodoItem } from '../models/todoItem';
import { generateUniqueID } from '../utils/Utils';
import { UserService } from './user.service';
import { ProjectService } from './project.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(
    public http: HttpClient,
    public userService: UserService,
    public projectService: ProjectService
  ) {}

  getByUserAndBoard(
    userID: string,
    boardID: string
  ): Promise<BoardNotification[]> {
    return this.http
      .get<BoardNotification[]>(
        'notifications/user/' + userID + '/board/' + boardID
      )
      .toPromise();
  }

  getByUserAndProject(
    userID: string,
    projectID: string
  ): Promise<ProjectNotification[]> {
    return this.http
      .get<ProjectNotification[]>(
        'notifications/user/' + userID + '/project/' + projectID
      )
      .toPromise();
  }

  add(
    type: NotificationType,
    notification: ProjectNotification | BoardNotification
  ): Promise<ProjectNotification | BoardNotification> {
    return this.http
      .post<ProjectNotification | BoardNotification>('notifications/', {
        type: type,
        notification: notification,
      })
      .toPromise();
  }

  markAsRead(
    type: NotificationType,
    notificationID: string
  ): Promise<ProjectNotification | BoardNotification> {
    return this.http
      .post<ProjectNotification | BoardNotification>(
        'notifications/' + notificationID,
        { type: type, viewed: true }
      )
      .toPromise();
  }

  remove(
    type: NotificationType,
    notificationID: string
  ): Promise<ProjectNotification | BoardNotification> {
    if (type === NotificationType.BOARD) {
      return this.http
        .delete<BoardNotification>('notifications/board/' + notificationID)
        .toPromise();
    } else {
      return this.http
        .delete<ProjectNotification>('notifications/project/' + notificationID)
        .toPromise();
    }
  }

  buildUpvoteNotification(post: Post): BoardNotification {
    return {
      notificationID: generateUniqueID(),
      text: this.userService.user?.username + ' upvoted "' + post.title + '"',
      type: NotificationType.BOARD,
      viewed: false,
      userID: post.userID,
      postID: post.postID,
      boardID: post.boardID,
    };
  }

  buildCommentNotification(post: Post): BoardNotification {
    return {
      notificationID: generateUniqueID(),
      text:
        this.userService.user?.username + ' commented on "' + post.title + '"',
      type: NotificationType.BOARD,
      viewed: false,
      userID: post.userID,
      postID: post.postID,
      boardID: post.boardID,
    };
  }

  buildTagNotification(post: Post): BoardNotification {
    return {
      notificationID: generateUniqueID(),
      text: this.userService.user?.username + ' tagged "' + post.title + '"',
      type: NotificationType.BOARD,
      viewed: false,
      userID: post.userID,
      postID: post.postID,
      boardID: post.boardID,
    };
  }

  buildTodoItemNotification(
    todoItem: TodoItem,
    project: Project,
    overdue: boolean
  ): ProjectNotification {
    const notificationID = generateUniqueID();
    let text: string;
    if (overdue) {
      text = `Todo Item: ${todoItem.title} for Project: ${project.name} overdue`;
    } else {
      text = `Pending Todo Item: ${todoItem.title} for Project: ${project.name}`;
    }
    return {
      notificationID: notificationID,
      text: text,
      viewed: false,
      type: NotificationType.PROJECT,
      userID: todoItem.userID,
      projectID: todoItem.projectID,
    };
  }
}
