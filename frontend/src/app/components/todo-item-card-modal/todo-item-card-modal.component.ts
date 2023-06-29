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
import { Group } from 'src/app/models/group';
import { AddTodoListModalComponent } from '../add-todo-list-modal/add-todo-list-modal.component';

const linkifyStr = require('linkifyjs/lib/linkify-string');

@Component({
  selector: 'app-todo-item-card-modal',
  templateUrl: './todo-item-card-modal.component.html',
  styleUrls: ['./todo-item-card-modal.component.scss'],
})
export class TodoItemCardModalComponent implements OnInit {
  todoItem: TodoItem;
  taskTitle: string = '';
  taskDescription: string = '';
  taskCompletionQuality: string = '';
  assignee: string = '';
  status: string = '';
  statusColor: string = '';
  taskTypes: string = '';
  EXPANDED_COMPLETION_QUALITY: typeof EXPANDED_COMPLETION_QUALITY =
    EXPANDED_COMPLETION_QUALITY;
  completionQualityOptions = [
    CompletionQuality.N_A,
    CompletionQuality.INCOMPLETE,
    CompletionQuality.VERY_UNSATISFIED,
    CompletionQuality.UNSATISFIED,
    CompletionQuality.NEUTRAL,
    CompletionQuality.SATISFIED,
    CompletionQuality.VERY_SATISFIED,
  ];
  completionQuality: CompletionQuality = CompletionQuality.N_A;
  defaultQuality = CompletionQuality.N_A;

  completionQualityFormControl = new FormControl('valid', [
    Validators.required,
  ]);
  matcher = new MyErrorStateMatcher();

  projectID: string;
  userID: string;
  group: Group | null;

  constructor(
    public dialogRef: MatDialogRef<TodoItemCardModalComponent>,
    public dialog: MatDialog,
    public groupService: GroupService,
    public userService: UserService,
    public todoItemService: TodoItemService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.todoItem = { ...data.todoItem };
    this.taskTitle = data.todoItem.title;
    this.projectID = data.projectID;
    this.userID = data.userID;
    this.group = data.group;
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
    if (data.todoItem.completed) {
      this.taskCompletionQuality = data.todoItem?.quality
        ? EXPANDED_COMPLETION_QUALITY[data.todoItem.quality]
        : EXPANDED_COMPLETION_QUALITY['SATISFIED'];
    }
    this.calclateTaskStatus(data.todoItem);
  }

  async ngOnInit(): Promise<void> {
    await this.updateAssignee(this.data.todoItem);
  }

  async updateAssignee(todoItem: TodoItem) {
    if (todoItem.groupID) {
      this.assignee = (await this.groupService.getById(todoItem.groupID)).name;
    } else {
      this.assignee = (
        await this.userService.getOneById(todoItem.userID)
      ).username;
    }
  }

  calclateTaskStatus(todoItem: TodoItem) {
    const date = new Date(
      `${todoItem.deadline.date} ${todoItem.deadline.time}`
    );
    const currentDate = new Date();
    const incomplete = todoItem?.quality == CompletionQuality.INCOMPLETE;
    const overdue = date < currentDate && !todoItem.completed;
    this.status = incomplete
      ? 'Incomplete'
      : overdue
      ? 'Missed'
      : todoItem.completed
      ? 'Complete'
      : 'Pending';
    this.statusColor = incomplete
      ? 'red'
      : overdue
      ? 'red'
      : todoItem.completed
      ? 'green'
      : 'orange';
  }

  async completeTask() {
    if (
      !this.completionQualityFormControl.valid ||
      this.completionQuality === 'N_A'
    ) {
      return;
    }
    const updatedTodo = await this.todoItemService.update(
      this.data.todoItem.todoItemID,
      {
        completed: true,
        quality: this.completionQuality,
      }
    );
    this.dialogRef.close();
    this.data.onComplete(updatedTodo);
  }

  async editTodoItem(todoItem: TodoItem) {
    this.dialog.open(AddTodoListModalComponent, {
      width: '600px',
      data: {
        projectID: this.projectID,
        userID: this.userID,
        todoItem: todoItem,
        group: todoItem.groupID
          ? await this.groupService.getById(todoItem.groupID)
          : null,
        onComplete: async (todoItem?: TodoItem) => {
          if (todoItem) {
            Object.assign(this.todoItem, todoItem);
            this.taskTitle = todoItem.title;
            this.taskDescription = linkifyStr(
              todoItem?.description ? todoItem.description : '',
              {
                defaultProtocol: 'https',
                target: '_blank',
              }
            );
            this.taskTypes = todoItem.type
              .map((type) => EXPANDED_TODO_TYPE[type])
              .join(', ');
            await this.updateAssignee(this.todoItem);
            this.data.onEdit(this.todoItem);
          }
        },
      },
    });
  }

  async restoreTodoItem(todoItem: TodoItem) {
    this.dialog.open(AddTodoListModalComponent, {
      width: '600px',
      data: {
        projectID: this.projectID,
        userID: this.userID,
        restoreTodoItem: todoItem,
        onComplete: async (todoItem?: TodoItem) => {
          if (todoItem) {
            Object.assign(this.todoItem, todoItem);
            this.taskCompletionQuality = EXPANDED_COMPLETION_QUALITY['N_A'];
            this.taskTitle = todoItem.title;
            this.taskDescription = linkifyStr(
              todoItem?.description ? todoItem.description : '',
              {
                defaultProtocol: 'https',
                target: '_blank',
              }
            );
            this.taskTypes = todoItem.type
              .map((type) => EXPANDED_TODO_TYPE[type])
              .join(', ');
            this.calclateTaskStatus(todoItem);
            await this.updateAssignee(this.todoItem);
            this.data.onRestore(todoItem);
          }
        },
      },
    });
  }

  onNoClick(): void {
    this.close();
  }

  close(): void {
    this.dialogRef.close();
  }
}
