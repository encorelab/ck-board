import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TodoItem } from '../models/todoItem';

@Injectable({
  providedIn: 'root',
})
export class TodoItemService {
  constructor(private http: HttpClient) {}

  getById(todoItemID: string): Promise<TodoItem> {
    return this.http.get<TodoItem>(`todoItems/${todoItemID}`).toPromise();
  }

  getByUserProject(userID: string, projectID: string): Promise<TodoItem[]> {
    return this.http
      .get<TodoItem[]>(`todoItems/${userID}/${projectID}`)
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
