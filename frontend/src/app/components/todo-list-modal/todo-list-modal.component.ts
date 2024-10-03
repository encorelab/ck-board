import { Component, OnInit, OnChanges, Input } from '@angular/core';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialog as MatDialog,
} from '@angular/material/legacy-dialog';
import { TodoItemService } from 'src/app/services/todoItem.service';
import { GroupService } from 'src/app/services/group.service';
import { TodoItem, CompletionQuality } from 'src/app/models/todoItem';
import {
  EXPANDED_TODO_TYPE,
  TODO_TYPE_COLORS,
  EXPANDED_COMPLETION_QUALITY,
} from 'src/app/utils/constants';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { SelectionModel } from '@angular/cdk/collections';
import { AddTodoListModalComponent } from '../add-todo-list-modal/add-todo-list-modal.component';
import { TodoItemCardModalComponent } from '../todo-item-card-modal/todo-item-card-modal.component';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { interval, Observable } from 'rxjs';
import { PausableObservable, pausable } from 'rxjs-pausable';
import { Group } from 'src/app/models/group';

@Component({
  selector: 'app-todo-list-modal',
  templateUrl: './todo-list-modal.component.html',
  styleUrls: ['./todo-list-modal.component.scss'],
})
export class TodoListModalComponent implements OnInit, OnChanges {
  minDate: Date;
  userGroups: Group[] = [];
  personalTodoItems: TodoItem[] = [];
  groupTodoItems: TodoItem[] = [];
  todoItemsMap: Map<string, TodoItem> = new Map();
  personalDataSource: MatTableDataSource<TodoItem> =
    new MatTableDataSource<TodoItem>([]);
  groupDataSource: MatTableDataSource<TodoItem> =
    new MatTableDataSource<TodoItem>([]);
  groupIDtoGroupMap: { [key: string]: Group } = {};

  selection = new SelectionModel<TodoItem>(true, []);
  pausable: PausableObservable<number>;
  completedItemsDataSource: MatTableDataSource<TodoItem> =
    new MatTableDataSource<TodoItem>([]);
  CONFETTI_DELAY = 3400;
  CONFETTI_DURATION = 500;
  todoItemTypes = EXPANDED_TODO_TYPE;
  todoItemColors = TODO_TYPE_COLORS;
  EXPANDED_COMPLETION_QUALITY: typeof EXPANDED_COMPLETION_QUALITY =
    EXPANDED_COMPLETION_QUALITY;
  CompletionQuality: typeof CompletionQuality = CompletionQuality;
  displayColumns = ['select', 'task-title', 'type', 'deadline', 'edit'];
  displayGroupColumns = [
    'select',
    'task-title',
    'type',
    'group',
    'deadline',
    'edit',
  ];
  completedDisplayColums = [
    'task-title',
    'type',
    'group',
    'quality',
    'completion-date',
    'options',
  ];

  @Input() projectID: string = '';
  @Input() userID: string = '';

  constructor(
    public dialog: MatDialog,
    public todoItemService: TodoItemService,
    public groupService: GroupService
  ) {}

  async ngOnInit() {
    await this.getTodoItems();

    // Create an observable using interval and cast it to any first
    const interval$ = interval(800) as any;

    // Apply pausable() and cast the result
    this.pausable = pausable()(interval$) as PausableObservable<number>;

    // Subscribe and pause initially
    this.pausable.subscribe(this.shoot.bind(this));
    this.pausable.pause();
  }

  async ngOnChanges() {
    await this.getTodoItems();
  }

  async getTodoItems() {
    try {
      this.personalTodoItems =
        (await this.todoItemService.getByUserProject(
          this.userID,
          this.projectID
        )) ?? [];

      this.userGroups =
        (await this.groupService.getByUserAndProject(
          this.userID,
          this.projectID
        )) ?? [];

      this.groupIDtoGroupMap = this.userGroups.reduce((map, obj) => {
        if (obj?.groupID) {
          map[obj.groupID] = obj;
        }
        return map;
      }, {} as { [key: string]: Group });

      this.groupTodoItems =
        (await this.todoItemService.getMultipleByGroup(
          this.userGroups.map((group) => group.groupID)
        )) ?? [];

      this.updateTableDataSource();
    } catch (error) {
      console.error('Error fetching todo items or groups:', error);
      // Handle error as needed
    }
  }

  updateTableDataSource() {
    this.personalDataSource = new MatTableDataSource<TodoItem>(
      this.personalTodoItems.filter(
        (todoItem) => !todoItem.completed && !todoItem.groupID
      )
    );

    this.groupDataSource = new MatTableDataSource<TodoItem>(
      this.groupTodoItems.filter((todoItem) => !todoItem.completed)
    );

    this.todoItemsMap = new Map(
      this.personalTodoItems.map((todo) => [todo.todoItemID, todo])
    );

    this.completedItemsDataSource = new MatTableDataSource<TodoItem>(
      [...this.todoItemsMap.values()].filter((todoItem) => todoItem.completed)
    );
  }

  isAllSelected(dataSource: MatTableDataSource<TodoItem>) {
    const numSelected = this.selection.selected.length;
    const numRows = dataSource?.data?.length ?? 0;
    return numSelected === numRows;
  }

  masterToggle(dataSource: MatTableDataSource<TodoItem>) {
    this.isAllSelected(dataSource)
      ? this.selection.clear()
      : dataSource.data?.forEach((row) => this.selection.select(row));
  }

  async completeTodoItem() {
    this.playAudio();
    setTimeout(() => {
      this.shoot();
      this.pausable?.resume();
      setTimeout(() => this.pausable?.pause(), this.CONFETTI_DURATION);
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
            try {
              for (const selected of this.selection.selected) {
                await this.todoItemService.remove(selected.todoItemID);
              }
              await this.getTodoItems();
            } catch (error) {
              console.error('Error deleting todo items:', error);
              // Handle error as needed
            }
          },
        },
      });
    }
  }

  async deleteTodoItems() {
    try {
      await Promise.all(
        this.selection.selected.map((todoItem) =>
          this.todoItemService.remove(todoItem.todoItemID)
        )
      );
      await this.getTodoItems();
    } catch (error) {
      console.error('Error deleting todo items:', error);
      // Handle error as needed
    }
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
            this.personalTodoItems.push(todoItem);
            dataSource = this.personalDataSource;
          }
          this.updateTableDataSource();
        },
      },
    });
  }

  editTodoItem(todo: TodoItem) {
    this.dialog.open(AddTodoListModalComponent, {
      width: '600px',
      data: {
        todoItem: todo,
        projectID: this.projectID,
        userID: this.userID,
        onComplete: async (updatedTodo: TodoItem) => {
          const index = this.personalTodoItems.findIndex(
            (t) => t.todoItemID === updatedTodo.todoItemID
          );
          if (index !== -1) {
            this.personalTodoItems[index] = updatedTodo;
          }
          this.updateTableDataSource();
        },
      },
    });
  }

  restoreTodoItem(todo: TodoItem) {
    if (todo.completed) {
      todo.completed = false;
      this.todoItemService
        .update(todo.todoItemID, todo)
        .then(() => {
          this.updateTableDataSource();
        })
        .catch((error) => {
          console.error('Error restoring todo item:', error);
        });
    }
  }

  openTodoItemViewModal(todo: TodoItem) {
    this.dialog.open(TodoItemCardModalComponent, {
      width: '600px',
      data: {
        todoItem: todo,
      },
    });
  }

  shoot() {
    // Confetti logic goes here
  }

  playAudio() {
    const audio = new Audio();
    audio.src = '../../../assets/sounds/applause.wav';
    audio.load();
    audio.play();
  }
}
