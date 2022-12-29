import { Component, OnInit, Inject } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { TodoListModalComponent } from '../todo-list-modal/todo-list-modal.component';
import { UserService } from 'src/app/services/user.service';
import User from 'src/app/models/user';
import { Project } from 'src/app/models/project';

@Component({
  selector: 'app-project-todo-list-modal',
  templateUrl: './project-todo-list-modal.component.html',
  styleUrls: ['./project-todo-list-modal.component.scss'],
})
export class ProjectTodoListModalComponent implements OnInit {
  project: Project;
  projectMembers: User[];

  constructor(
    public dialgoRef: MatDialogRef<ProjectTodoListModalComponent>,
    public dialog: MatDialog,
    public userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.project = data.project;
  }

  ngOnInit(): void {
    const tempUsers: User[] = [];
    this.project.members.forEach(async (userID) => {
      const user = await this.userService.getOneById(userID);
      if (user) tempUsers.push(user);
    });
    this.projectMembers = tempUsers;
  }

  openMemberTodoList(user: User) {
    this.dialog.open(TodoListModalComponent, {
      width: '900px',
      data: {
        project: this.project,
        user: user,
      },
    });
  }

  onNoClick(): void {
    this.dialgoRef.close();
  }
}
