import { Component, OnInit, Inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { TodoItemService } from 'src/app/services/todoItem.service';
import { TodoItem } from 'src/app/models/todoItem';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { AddTodoListModalComponent } from '../add-todo-list-modal/add-todo-list-modal.component';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { interval } from 'rxjs';
import { PausableObservable, pausable } from 'rxjs-pausable';

@Component({
  selector: 'app-todo-list-modal',
  templateUrl: './todo-list-modal.component.html',
  styleUrls: ['./todo-list-modal.component.scss'],
})
export class TodoListModalComponent implements OnInit {
  minDate: Date;
  todoItems: TodoItem[];
  projectID: string;
  userID: string;
  displayColumns: string[];
  selection = new SelectionModel<TodoItem>(true, []);
  pausable: PausableObservable<number>;
  dataSource: MatTableDataSource<TodoItem>;

  constructor(
    public dialogRef: MatDialogRef<TodoListModalComponent>,
    public dialog: MatDialog,
    public todoItemService: TodoItemService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.projectID = data.project.projectID;
    this.userID = data.user.userID;
    this.displayColumns = ['select', 'task-title', 'deadline'];
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
    this.todoItems = await this.todoItemService.getByUserProject(
      this.userID,
      this.projectID
    );

    this.dataSource = new MatTableDataSource<TodoItem>(
      this.todoItems.filter((todoItem: TodoItem) => !todoItem.completed)
    );
    console.log(this.dataSource.data);
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  async completeTodoItems() {
    if (this.selection.selected.length > 0) {
      this.selection.selected.forEach(async (todoItem) => {
        await this.todoItemService.update(todoItem.todoItemID, {
          completed: true,
        });
      });
      await this.getTodoItems();
      this.dialogRef.close();
      this.pausable.resume();
      this.shoot();
      this.playAudio();
      setTimeout(() => this.pausable.pause(), 4000);
    }
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
            await this.deleteTodoItems();
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
          this.todoItems.push(todoItem);
          const data = this.dataSource.data;
          data.push(todoItem);
          this.dataSource.data = data;
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
