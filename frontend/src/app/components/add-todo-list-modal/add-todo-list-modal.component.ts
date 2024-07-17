import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TodoItemService } from 'src/app/services/todoItem.service';
import { GroupService } from 'src/app/services/group.service';
import {
  TodoItem,
  TodoItemType,
  CompletionQuality,
} from 'src/app/models/todoItem';
import { Group } from 'src/app/models/group';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';
import { generateUniqueID } from 'src/app/utils/Utils';
import {
  TODO_TITLE_MAX_LENGTH,
  EXPANDED_TODO_TYPE,
} from 'src/app/utils/constants';

@Component({
  selector: 'app-add-todo-list-modal',
  templateUrl: './add-todo-list-modal.component.html',
  styleUrls: ['./add-todo-list-modal.component.scss'],
})
export class AddTodoListModalComponent implements OnInit {
  taskTitle = '';
  taskDescription = '';
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
  taskTitleControl = new UntypedFormControl('', [
    Validators.required,
    Validators.maxLength(TODO_TITLE_MAX_LENGTH),
  ]);
  todoItemTypeFormControl = new UntypedFormControl('valid', [Validators.required]);
  todoItemTypes: TodoItemType[] = [];
  EXPANDED_TODO_TYPE: typeof EXPANDED_TODO_TYPE = EXPANDED_TODO_TYPE;
  todoItemOptions = [
    TodoItemType.COGNITION,
    TodoItemType.SEL,
    TodoItemType.BEHAVIOURAL,
    TodoItemType.ATL,
    TodoItemType.CLASS,
  ];
  selectedGroup: Group | undefined;
  userGroups: Group[];

  matcher = new MyErrorStateMatcher();

  projectID: string;
  userID: string;
  editing = false;
  restoring = false;

  TODO_TITLE_MAX_LENGTH = TODO_TITLE_MAX_LENGTH;

  todoTypeTooltip = `
    Content learning (i.e., learning strategies for memorization, recall, or application of knowledge)

    Social-emotional learning (i.e., supports for developing your emotional awareness, stress management, motivation, math identity, relationships, or critical/creative thinking)

    ATL skills (i.e., thining skills, self-management skills, and research skills)

    Classroom engagement (i.e., practices for improving learning engagement, e.g., note-taking, asking questions, designing/explaining/suggesting ideas, or generating/sharing ideas with classmates)
  `;

  constructor(
    public dialogRef: MatDialogRef<AddTodoListModalComponent>,
    public todoItemService: TodoItemService,
    public groupService: GroupService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.projectID = data.projectID;
    this.userID = data.userID;
    if (data.todoItem) {
      this.editing = true;
      this.taskDeadlineDate = new Date(data.todoItem.deadline.date);
      this.taskTitle = data.todoItem.title;
      this.taskDescription = data.todoItem.description;
      const time = data.todoItem.deadline.time.split(':');
      this.timeHour = parseInt(time[0]);
      this.timeMinute = parseInt(time[1]);
      this.timePeriod = time[2].split(' ')[1];
      this.todoItemTypes = data.todoItem.type;
    } else if (data.restoreTodoItem) {
      this.restoring = true;
      this.taskTitle = data.restoreTodoItem.title;
      this.taskDescription = data.restoreTodoItem.description;
      this.todoItemTypes = data.restoreTodoItem.type;
    }
  }

  async ngOnInit(): Promise<void> {
    this.userGroups = await this.groupService.getByUserAndProject(
      this.userID,
      this.projectID
    );
    if (this.data.group) {
      this.selectedGroup = this.userGroups.find(
        (g) => g.groupID === this.data.group.groupID
      );
    }
  }

  async createTodoItem() {
    const todoItem: TodoItem = {
      todoItemID: generateUniqueID(),
      projectID: this.projectID,
      userID: this.userID,
      title: this.taskTitle,
      description: this.taskDescription,
      groupID: this.selectedGroup ? this.selectedGroup.groupID : '',
      completed: false,
      quality: CompletionQuality.N_A,
      overdue: false,
      type: this.todoItemTypes,
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
      description: this.taskDescription,
      groupID: this.selectedGroup ? this.selectedGroup.groupID : '',
      type: this.todoItemTypes,
      deadline: {
        date: this.taskDeadlineDate.toDateString(),
        time: `${this.timeHour}:${String(this.timeMinute).padStart(
          2,
          '0'
        )}:00 ${this.timePeriod}`,
      },
    };

    const updatedTodo = await this.todoItemService.update(
      this.data.todoItem.todoItemID,
      todoItem
    );
    this.data.onComplete(updatedTodo);
    this.dialogRef.close();
  }

  async restoreTodoItem() {
    const todoItem: Partial<TodoItem> = {
      title: this.taskTitle,
      description: this.taskDescription,
      completed: false,
      quality: CompletionQuality.N_A,
      overdue: false,
      groupID: this.selectedGroup ? this.selectedGroup.groupID : '',
      type: this.todoItemTypes,
      deadline: {
        date: this.taskDeadlineDate.toDateString(),
        time: `${this.timeHour}:${String(this.timeMinute).padStart(
          2,
          '0'
        )}:00 ${this.timePeriod}`,
      },
    };

    const restoredTodo = await this.todoItemService.update(
      this.data.restoreTodoItem.todoItemID,
      todoItem
    );
    this.data.onComplete(restoredTodo);
    this.dialogRef.close();
    return todoItem;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
