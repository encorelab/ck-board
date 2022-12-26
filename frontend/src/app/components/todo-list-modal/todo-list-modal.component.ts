import { Component, OnInit, Inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { TodoItemService } from 'src/app/services/todoItem.service';
import { GroupService } from 'src/app/services/group.service';
import { TodoItem } from 'src/app/models/todoItem';
import { EXPANDED_TODO_TYPE, TODO_TYPE_COLORS } from 'src/app/utils/constants';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { AddTodoListModalComponent } from '../add-todo-list-modal/add-todo-list-modal.component';
import { TodoItemCardModalComponent } from '../todo-item-card-modal/todo-item-card-modal.component';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { interval } from 'rxjs';
import { PausableObservable, pausable } from 'rxjs-pausable';
import { Group } from 'src/app/models/group';

@Component({
  selector: 'app-todo-list-modal',
  templateUrl: './todo-list-modal.component.html',
  styleUrls: ['./todo-list-modal.component.scss'],
})
export class TodoListModalComponent implements OnInit {
  minDate: Date;
  userGroups: Group[];
  personalTodoItems: TodoItem[];
  groupTodoItems: TodoItem[];
  todoItemsMap: Map<string, TodoItem>;
  personalDataSource: MatTableDataSource<TodoItem>;
  groupDataSource: MatTableDataSource<TodoItem>;
  groupIDtoGroupMap: object;

  projectID: string;
  userID: string;
  displayColumns: string[];
  displayGroupColumns: string[];
  completedDisplayColums: string[];
  selection = new SelectionModel<TodoItem>(true, []);
  pausable: PausableObservable<number>;
  completedItemsDataSource: MatTableDataSource<TodoItem>;
  CONFETTI_DELAY = 3400;
  CONFETTI_DURATION = 500;
  todoItemTypes = EXPANDED_TODO_TYPE;
  todoItemColors = TODO_TYPE_COLORS;

  constructor(
    public dialogRef: MatDialogRef<TodoListModalComponent>,
    public dialog: MatDialog,
    public todoItemService: TodoItemService,
    public groupService: GroupService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.projectID = data.project.projectID;
    this.userID = data.user.userID;
    this.displayColumns = ['select', 'task-title', 'type', 'deadline', 'edit'];
    this.displayGroupColumns = [
      'select',
      'task-title',
      'type',
      'group',
      'deadline',
      'edit',
    ];
    this.completedDisplayColums = [
      'task-title',
      'type',
      'group',
      'completion-date',
      'options',
    ];
  }

  async ngOnInit() {
    await this.getTodoItems();
    this.pausable = interval(800).pipe(
      pausable()
    ) as PausableObservable<number>;
    this.pausable.subscribe(this.shoot.bind(this));
    this.pausable.pause();
  }

  async getTodoItems() {
    this.personalTodoItems = await this.todoItemService.getByUserProject(
      this.userID,
      this.projectID
    );

    this.userGroups = await this.groupService.getByUserAndProject(
      this.userID,
      this.projectID
    );

    this.groupIDtoGroupMap = this.userGroups.reduce(function (map, obj) {
      map[obj.groupID] = obj;
      return map;
    }, {});

    this.groupTodoItems = await this.todoItemService.getMultipleByGroup(
      this.userGroups.map((group) => group.groupID)
    );

    this.personalDataSource = new MatTableDataSource<TodoItem>(
      this.personalTodoItems.filter(
        (todoItem: TodoItem) => !todoItem.completed && !todoItem.groupID
      )
    );

    this.groupDataSource = new MatTableDataSource<TodoItem>(
      this.groupTodoItems.filter((todoItem: TodoItem) => !todoItem.completed)
    );

    this.todoItemsMap = new Map(
      this.personalTodoItems.map((todo) => [todo.todoItemID, todo])
    );

    this.completedItemsDataSource = new MatTableDataSource<TodoItem>(
      [...this.todoItemsMap.values()].filter(
        (todoItem: TodoItem) => todoItem.completed
      )
    );
  }

  isAllSelected(dataSource) {
    const numSelected = this.selection.selected.length;
    const numRows = dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(dataSource) {
    this.isAllSelected(dataSource)
      ? this.selection.clear()
      : dataSource.data.forEach((row) => this.selection.select(row));
  }

  async completeTodoItem() {
    await this.getTodoItems();
    this.dialogRef.close();
    this.playAudio();
    setTimeout(() => {
      this.shoot();
      this.pausable.resume();
      setTimeout(() => this.pausable.pause(), this.CONFETTI_DURATION);
    }, this.CONFETTI_DELAY);
  }

  async handleDeleteTodoItems() {
    if (this.selection.selected.length > 0) {
      this.dialog.open(ConfirmModalComponent, {
        width: '500px',
        data: {
          title: 'Confirmation',
          message:
            'This will permanently delete the selected Todo Items. Are you sure you want to do this?',
          handleConfirm: async () => {
            for (let i = 0; i < this.selection.selected.length; i++) {
              await this.todoItemService.remove(
                this.selection.selected[i].todoItemID
              );
            }
            await this.getTodoItems();
          },
        },
      });
      ``;
    }
  }

  async deleteTodoItems() {
    this.selection.selected.forEach(async (todoItem) => {
      await this.todoItemService.remove(todoItem.todoItemID);
    });
    await this.getTodoItems();
  }

  openAddTodoItemModal() {
    this.dialog.open(AddTodoListModalComponent, {
      width: '600px',
      data: {
        projectID: this.projectID,
        userID: this.userID,
        onComplete: async (todoItem: TodoItem) => {
          let dataSource: MatTableDataSource<TodoItem>;
          if (todoItem.groupID) {
            this.groupTodoItems.push(todoItem);
            dataSource = this.groupDataSource;
          } else {
            dataSource = this.personalDataSource;
            this.personalTodoItems.push(todoItem);
          }
          const data = dataSource.data;
          data.push(todoItem);
          dataSource.data = data;
        },
      },
    });
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
        onComplete: async () => {
          await this.getTodoItems();
        },
      },
    });
  }

  async openTodoItemViewModal(todoItem) {
    this.dialog.open(TodoItemCardModalComponent, {
      width: '500px',
      data: {
        todoItem: todoItem,
        onComplete: async () => {
          await this.completeTodoItem();
        },
      },
    });
  }

  restoreTodoItem(todoItem: TodoItem) {
    this.dialog.open(AddTodoListModalComponent, {
      width: '600px',
      data: {
        projectID: this.projectID,
        userID: this.userID,
        restoreTodoItem: todoItem,
        onComplete: async () => {
          await this.getTodoItems();
        },
      },
    });
  }

  shoot() {
    try {
      this.confetti({
        angle: this.random(60, 120),
        spread: this.random(10, 50),
        particleCount: this.random(50, 60),
        origin: {
          y: 0.6,
        },
      });
    } catch (e) {
      // noop, confettijs may not be loaded yet
    }
  }

  playAudio() {
    const audio = new Audio();
    audio.src = '../../../assets/celebration-sound-effect.wav';
    audio.load();
    audio.play();
  }

  random(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  confetti(args: any) {
    return window['confetti'].apply(this, arguments);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
