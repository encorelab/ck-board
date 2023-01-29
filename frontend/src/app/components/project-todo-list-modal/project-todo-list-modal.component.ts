import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { TodoListModalComponent } from '../todo-list-modal/todo-list-modal.component';
import {
  MatDialogModule,
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialog,
} from '@angular/material/dialog';
import { UserService } from 'src/app/services/user.service';
import User, { AuthUser, Role } from 'src/app/models/user';
import { Project } from 'src/app/models/project';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from 'src/app/services/project.service';

@Component({
  selector: 'app-project-todo-list-modal',
  templateUrl: './project-todo-list-modal.component.html',
  styleUrls: ['./project-todo-list-modal.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ProjectTodoListModalComponent implements OnInit {
  project: Project;
  projectID: string;
  projectMembers: User[];
  todoModalUser: string;
  user: AuthUser;

  embedded: boolean = false;
  Role: typeof Role = Role;

  constructor(
    public userService: UserService,
    public projectService: ProjectService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog
  ) {
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params.embedded === 'true') {
        this.embedded = true;
      }
    });
  }

  async ngOnInit(): Promise<void> {
    const map = this.activatedRoute.snapshot.paramMap;
    if (map.has('projectID')) {
      this.projectID =
        this.activatedRoute.snapshot.paramMap.get('projectID') ?? '';
    } else {
      this.router.navigate(['error']);
    }

    this.user = this.userService.user!;
    this.project = await this.projectService.get(this.projectID);
    if (this.user.role === Role.TEACHER) {
      const tempUsers: User[] = [];
      this.project.members.forEach(async (userID) => {
        const user = await this.userService.getOneById(userID);
        if (user) tempUsers.push(user);
      });
      this.projectMembers = tempUsers;
    } else {
      this.todoModalUser = this.user.userID;
    }
  }

  openMemberTodoList(user: User) {
    this.todoModalUser = user.userID;
  }

  closeTodoList() {
    this.todoModalUser = '';
  }

  copyEmbedCode() {
    const url = window.location.href + '?embedded=true';
    navigator.clipboard.writeText(url);
  }
}
