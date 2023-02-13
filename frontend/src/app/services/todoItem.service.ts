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
    return this.http
      .get<TodoItem[]>(`todoItems/project/${projectID}`)
      .toPromise();
  }

  getMultipleByGroup(ids: string[]): Promise<TodoItem[]> {
    return this.http
      .post<TodoItem[]>('todoItems/group/multiple', ids)
      .toPromise();
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
}
