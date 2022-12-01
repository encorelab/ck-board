import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TodoItem } from '../models/todoItem';
import { NotificationService } from './notification.service';
import { SocketService } from './socket.service';
import { SocketEvent, TODOITEM_NOTIFICATION } from '../utils/constants';
import { ProjectService } from './project.service';

@Injectable({
  providedIn: 'root',
})
export class TodoItemService {
  constructor(
    private http: HttpClient,
    private socketService: SocketService,
    private notificationService: NotificationService,
    private projectService: ProjectService
  ) {}

  getById(todoItemID: string): Promise<TodoItem> {
    return this.http.get<TodoItem>(`todoItems/${todoItemID}`).toPromise();
  }

  getByUserProject(userID: string, projectID: string): Promise<TodoItem[]> {
    return this.http
      .get<TodoItem[]>(`todoItems/${userID}/${projectID}`)
      .toPromise();
  }

  getByUser(userID: string): Promise<TodoItem[]> {
    return this.http.get<TodoItem[]>(`todoItems/user/${userID}`).toPromise();
  }

  getByProject(projectID: string): Promise<TodoItem[]> {
    return this.http.get<TodoItem[]>(`todoItems/project/${projectID}`).toPromise();
  }

  create(todoItem: TodoItem): Promise<TodoItem> {
    return this.http.post<TodoItem>(`todoItems/`, todoItem).toPromise();
  }

  update(todoItemID: string, todoItem: Partial<TodoItem>) {
    return this.http
      .post<TodoItem[]>(`todoItems/${todoItemID}`, todoItem)
      .toPromise();
  }

  remove(todoItemID: string) {
    return this.http.delete<TodoItem>(`todoItems/${todoItemID}`).toPromise();
  }

  async sendReminder() {
    this.socketService.emit(SocketEvent.NOTIFICATION_CREATE, {});
    const diff_hours = (dt2: Date, dt1: Date) => {
      let diff = (dt2.getTime() - dt1.getTime()) / 1000;
      diff /= 60 * 60;
      return Math.abs(Math.round(diff));
    };
    const user = localStorage.getItem('user');
    if (user) {
      const userID = JSON.parse(user).userID;
      const todoItems: TodoItem[] = await this.getByUser(userID);
      const currentTime: Date = new Date();
      for (let i = 0; i < todoItems.length; i++) {
        if (todoItems[i].overdue || todoItems[i].completed) continue;
        const deadline: Date = new Date(
          `${todoItems[i].deadline.date} ${todoItems[i].deadline.time}`
        );
        if (currentTime > deadline) {
          const project = await this.projectService.get(todoItems[i].projectID);
          await this.update(todoItems[i].todoItemID, { overdue: true });
          this.socketService.emit(
            SocketEvent.NOTIFICATION_CREATE,
            this.notificationService.buildTodoItemNotification(
              todoItems[i],
              project,
              true
            )
          );
        }

        const timeDifference = diff_hours(deadline, currentTime);

        if (
          timeDifference > 12 &&
          timeDifference <= 24 &&
          !todoItems[i].notifications.includes(TODOITEM_NOTIFICATION.INITIAL)
        ) {
          const project = await this.projectService.get(todoItems[i].projectID);
          this.socketService.emit(
            SocketEvent.NOTIFICATION_CREATE,
            this.notificationService.buildTodoItemNotification(
              todoItems[i],
              project,
              false
            )
          );
          this.update(todoItems[i].todoItemID, {
            notifications: [
              ...todoItems[i].notifications,
              TODOITEM_NOTIFICATION.INITIAL,
            ],
          });
        } else if (
          timeDifference <= 12 &&
          !todoItems[i].notifications.includes(TODOITEM_NOTIFICATION.SECONDARY)
        ) {
          const project = await this.projectService.get(todoItems[i].projectID);
          this.socketService.emit(
            SocketEvent.NOTIFICATION_CREATE,
            this.notificationService.buildTodoItemNotification(
              todoItems[i],
              project,
              false
            )
          );
          this.update(todoItems[i].todoItemID, {
            notifications: [
              ...todoItems[i].notifications,
              TODOITEM_NOTIFICATION.SECONDARY,
            ],
          });
        }
      }
    }
  }
}
