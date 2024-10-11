import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ExpandedTodoItem, TodoItem } from '../models/todoItem';
import { NotificationService } from './notification.service';
import { SocketService } from './socket.service';
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
    return this.http
      .get<TodoItem>(`todoItems/${todoItemID}`)
      .toPromise()
      .then((todoItem) => todoItem ?? ({} as TodoItem)); // Default to an empty object
  }

  getByUserProject(userID: string, projectID: string): Promise<TodoItem[]> {
    return this.http
      .get<TodoItem[]>(`todoItems/${userID}/${projectID}`)
      .toPromise()
      .then((todoItems) => todoItems ?? []); // Default to an empty array
  }

  getByUser(userID: string): Promise<TodoItem[]> {
    return this.http
      .get<TodoItem[]>(`todoItems/user/${userID}`)
      .toPromise()
      .then((todoItems) => todoItems ?? []); // Default to an empty array
  }

  getByProject(
    projectID: string,
    representation = 'default'
  ): Promise<ExpandedTodoItem[]> {
    return this.http
      .get<ExpandedTodoItem[]>(
        `todoItems/project/${projectID}?representation=${representation}`
      )
      .toPromise()
      .then((expandedTodoItems) => expandedTodoItems ?? []); // Default to an empty array
  }

  getMultipleByGroup(ids: string[]): Promise<TodoItem[]> {
    return this.http
      .post<TodoItem[]>('todoItems/group/multiple', ids)
      .toPromise()
      .then((todoItems) => todoItems ?? []); // Default to an empty array
  }

  create(todoItem: TodoItem): Promise<TodoItem> {
    return this.http
      .post<TodoItem>(`todoItems/`, todoItem)
      .toPromise()
      .then((newTodoItem) => newTodoItem ?? ({} as TodoItem)); // Default to an empty object
  }

  update(todoItemID: string, todoItem: Partial<TodoItem>): Promise<TodoItem[]> {
    return this.http
      .post<TodoItem[]>(`todoItems/${todoItemID}`, todoItem)
      .toPromise()
      .then((updatedTodoItems) => updatedTodoItems ?? []); // Default to an empty array
  }

  remove(todoItemID: string): Promise<TodoItem> {
    return this.http
      .delete<TodoItem>(`todoItems/${todoItemID}`)
      .toPromise()
      .then((deletedTodoItem) => deletedTodoItem ?? ({} as TodoItem)); // Default to an empty object
  }
}
