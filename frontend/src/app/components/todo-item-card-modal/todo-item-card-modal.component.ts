import { Component, OnInit, Inject } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { GroupService } from 'src/app/services/group.service';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import {
  TodoItem,
  TodoItemType,
  CompletionQuality,
} from 'src/app/models/todoItem';
import { FormControl, Validators } from '@angular/forms';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';
import {
  EXPANDED_TODO_TYPE,
  EXPANDED_COMPLETION_QUALITY,
} from 'src/app/utils/constants';
import { TodoItemService } from 'src/app/services/todoItem.service';

const linkifyStr = require('linkifyjs/lib/linkify-string');

@Component({
  selector: 'app-todo-item-card-modal',
  templateUrl: './todo-item-card-modal.component.html',
  styleUrls: ['./todo-item-card-modal.component.scss'],
})
export class TodoItemCardModalComponent implements OnInit {
  taskTitle: string = '';
  taskDescription: string = '';
  assignee: string = '';
  status: string = '';
  statusColor: string = '';
  taskTypes: string = '';
  completionQualityOptions = EXPANDED_COMPLETION_QUALITY;
  completionQuality: CompletionQuality = CompletionQuality.N_A;
  defaultQuality = CompletionQuality.N_A;

  completionQualityFormControl = new FormControl('valid', [
    Validators.required,
  ]);
  matcher = new MyErrorStateMatcher();

  constructor(
    public dialogRef: MatDialogRef<TodoItemCardModalComponent>,
    public groupService: GroupService,
    public userService: UserService,
    public todoItemService: TodoItemService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.taskTitle = data.todoItem.title;
    this.taskDescription = linkifyStr(
      data.todoItem?.description ? data.todoItem.description : '',
      {
        defaultProtocol: 'https',
        target: '_blank',
      }
    );
    this.taskTypes = data.todoItem.type
      .map((type) => EXPANDED_TODO_TYPE[type])
      .join(', ');
    const date = new Date(
      `${data.todoItem.deadline.date} ${data.todoItem.deadline.time}`
    );
    const currentDate = new Date();
    const overdue = date < currentDate && !data.todoItem.completed;
    this.status = overdue
      ? 'Missed'
      : data.todoItem.completed
      ? 'Complete'
      : 'Pending';
    this.statusColor = overdue
      ? 'red'
      : data.todoItem.completed
      ? 'green'
      : 'orange';
  }

  async ngOnInit(): Promise<void> {
    if (this.data.todoItem.groupID) {
      this.assignee = (
        await this.groupService.getById(this.data.todoItem.groupID)
      ).name;
    } else {
      this.assignee = (
        await this.userService.getOneById(this.data.todoItem.userID)
      ).username;
    }
  }

  async completeTask() {
    await this.todoItemService.update(this.data.todoItem.todoItemID, {
      completed: true,
      quality: this.completionQuality,
    });
    this.dialogRef.close();
    this.data.onComplete();
  }

  close(): void {
    this.dialogRef.close();
  }
}
