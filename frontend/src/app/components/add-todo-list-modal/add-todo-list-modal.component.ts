import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TodoItemService } from 'src/app/services/todoItem.service';
import { TodoItem } from 'src/app/models/todoItem';
import { FormControl, Validators } from '@angular/forms';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { generateUniqueID } from 'src/app/utils/Utils';

@Component({
  selector: 'app-add-todo-list-modal',
  templateUrl: './add-todo-list-modal.component.html',
  styleUrls: ['./add-todo-list-modal.component.scss'],
})
export class AddTodoListModalComponent implements OnInit {
  taskTitle = '';
  taskDeadlineDate: Date = new Date();
  timeHour = 12;
  timeMinute = 0;
  timePeriod = 'AM';
  hourRange = Array(12)
    .fill(0)
    .map((_, i) => i + 1);
  minuteRange = Array(4)
    .fill(0)
    .map((_, i) => i * 15);
  minDate: Date = new Date();
  taskTitleControl = new FormControl('', [
    Validators.required,
    Validators.maxLength(50),
  ]);

  matcher = new MyErrorStateMatcher();

  projectID: string;
  userID: string;

  constructor(
    public dialogRef: MatDialogRef<AddTodoListModalComponent>,
    public todoItemService: TodoItemService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.projectID = data.projectID;
    this.userID = data.userID;
  }

  ngOnInit(): void {}

  async createTodoItem() {
    console.log(this.taskDeadlineDate);
    console.log(this.timeHour);
    console.log(this.timeMinute);
    console.log(this.timePeriod);

    const todoItem: TodoItem = {
      todoItemID: generateUniqueID(),
      projectID: this.projectID,
      userID: this.userID,
      title: this.taskTitle,
      completed: false,
      deadline: {
        date: this.taskDeadlineDate.toDateString(),
        time: `${this.timeHour}:${String(this.timeMinute).padStart(2,'0')}:00 ${this.timePeriod}`,
      },
    };

    await this.todoItemService.create(todoItem);
    this.data.onComplete(todoItem);
    this.dialogRef.close();
    return todoItem;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
