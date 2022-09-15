import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TodoItemService } from 'src/app/services/todoItem.service';
import { TodoItem } from 'src/app/models/todoItem';
import { FormControl, Validators } from '@angular/forms';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';
import { generateUniqueID } from 'src/app/utils/Utils';

@Component({
  selector: 'app-add-todo-list-modal',
  templateUrl: './add-todo-list-modal.component.html',
  styleUrls: ['./add-todo-list-modal.component.scss'],
})
export class AddTodoListModalComponent implements OnInit {
  taskTitle = '';
  taskDeadlineDate: Date = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
  timeHour = 12;
  timeMinute = 0;
  timePeriod = 'AM';
  hourRange = Array(12)
    .fill(0)
    .map((_, i) => i + 1);
  minuteRange = Array(4)
    .fill(0)
    .map((_, i) => i * 15);
  taskTitleControl = new FormControl('', [
    Validators.required,
    Validators.maxLength(50),
  ]);

  matcher = new MyErrorStateMatcher();

  projectID: string;
  userID: string;
  editing = false;
  restoring = false;

  constructor(
    public dialogRef: MatDialogRef<AddTodoListModalComponent>,
    public todoItemService: TodoItemService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.projectID = data.projectID;
    this.userID = data.userID;
    if (data.todoItem) {
      this.editing = true;
      this.taskDeadlineDate = new Date(data.todoItem.deadline.date);
      this.taskTitle = data.todoItem.title;
      const time = data.todoItem.deadline.time.split(':');
      this.timeHour = parseInt(time[0]);
      this.timeMinute = parseInt(time[1]);
      this.timePeriod = time[2].split(' ')[1];
    } else if (data.restoreTodoItem) {
      this.restoring = true;
      this.taskTitle = data.restoreTodoItem.title;
    }
  }

  ngOnInit(): void {}

  async createTodoItem() {
    const todoItem: TodoItem = {
      todoItemID: generateUniqueID(),
      projectID: this.projectID,
      userID: this.userID,
      title: this.taskTitle,
      completed: false,
      overdue: false,
      notifications: [],
      deadline: {
        date: this.taskDeadlineDate.toDateString(),
        time: `${this.timeHour}:${String(this.timeMinute).padStart(
          2,
          '0'
        )}:00 ${this.timePeriod}`,
      },
    };

    await this.todoItemService.create(todoItem);
    this.data.onComplete(todoItem);
    this.dialogRef.close();
    return todoItem;
  }

  async updateTodoItem() {
    const todoItem: Partial<TodoItem> = {
      title: this.taskTitle,
      deadline: {
        date: this.taskDeadlineDate.toDateString(),
        time: `${this.timeHour}:${String(this.timeMinute).padStart(
          2,
          '0'
        )}:00 ${this.timePeriod}`,
      },
    };

    await this.todoItemService.update(this.data.todoItem.todoItemID, todoItem);
    this.data.onComplete();
    this.dialogRef.close();
    return todoItem;
  }

  async restoreTodoItem() {
    const todoItem: Partial<TodoItem> = {
      title: this.taskTitle,
      completed: false,
      overdue: false,
      deadline: {
        date: this.taskDeadlineDate.toDateString(),
        time: `${this.timeHour}:${String(this.timeMinute).padStart(
          2,
          '0'
        )}:00 ${this.timePeriod}`,
      },
    };

    await this.todoItemService.update(
      this.data.restoreTodoItem.todoItemID,
      todoItem
    );
    this.data.onComplete();
    this.dialogRef.close();
    return todoItem;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
