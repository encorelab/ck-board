import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from 'src/app/services/user.service';
import User, { AuthUser, Role } from 'src/app/models/user';
import { Project } from 'src/app/models/project';
import { ActivatedRoute, Router } from '@angular/router';
import { ProjectService } from 'src/app/services/project.service';
import { Subscription } from 'rxjs'

@Component({
  selector: 'app-project-todo-list-modal',
  templateUrl: './project-todo-list-modal.component.html',
  styleUrls: ['./project-todo-list-modal.component.scss'],
})
export class ProjectTodoListModalComponent implements OnInit, OnDestroy {
  private subscription: Subscription;

  project: Project;
  projectID: string;
  projectMembers: User[];
  todoModalUser: string;
  user: AuthUser;

  embedded: boolean = false;
  Role: typeof Role = Role;

  loading: boolean = true;

  constructor(
    public userService: UserService,
    public projectService: ProjectService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog
  ) {
    this.subscription = this.activatedRoute.queryParams.subscribe((params) => {
      if (params.embedded === 'true') {
        this.embedded = true;
      }
    });
  }

  async ngOnInit(): Promise<void> {
    const map = this.activatedRoute.snapshot.paramMap;
    if (map.has('projectID')) {
      this.projectID = map.get('projectID') ?? '';
    } else {
      this.router.navigate(['error']);
    }

    this.loading = true;
    if (this.userService.user) this.user = this.userService.user;
    this.project = await this.projectService.get(this.projectID);
    if (this.user.role === Role.TEACHER) {
      this.projectMembers = await this.userService.getMultipleByIds(this.project.members)
    } else {
      this.todoModalUser = this.user.userID;
    }
    this.loading = false;
  }

  openMemberTodoList(user: User): void {
    this.todoModalUser = user.userID;
  }

  closeTodoList(): void {
    this.todoModalUser = '';
  }

  copyEmbedCode(): void {
    const url = window.location.href + '?embedded=true';
    navigator.clipboard.writeText(url);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
