import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Project } from 'src/app/models/project';
import User, { Role } from 'src/app/models/user';
import { BoardService } from 'src/app/services/board.service';
import { ProjectService } from 'src/app/services/project.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-project-configuration-modal',
  templateUrl: './project-configuration-modal.component.html',
  styleUrls: ['./project-configuration-modal.component.scss'],
})
export class ProjectConfigurationModalComponent implements OnInit {
  project: Project;
  members: User[];
  user: User;

  nameEditable: string;
  membershipDisabledEditable: boolean;

  Role: typeof Role = Role;

  loading: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ProjectConfigurationModalComponent>,
    public boardService: BoardService,
    public userService: UserService,
    public projectService: ProjectService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.project = data.project;
    this.user = data.user;
    this.nameEditable = this.project.name;
    this.membershipDisabledEditable = this.project.membershipDisabled;
  }

  ngOnInit(): void {
    this.userService.getMultipleByIds(this.project.members)
      .then((users) => {
        this.members = users.sort((a, b) => b.role.charCodeAt(0) - a.role.charCodeAt(0));
      });
  }

  handleDialogSubmit(): void {
    this.loading = true;
    this.projectService.update(this.project.projectID, {
      name: this.nameEditable,
      membershipDisabled: this.membershipDisabledEditable,
      members: this.members.map((user) => user.userID),
    })
      .then((project) => {
        this.project = project;
      })
      .finally(() => {
        this.close();
        this.loading = false;
      });
  }

  removeUser(_user: User): void {
    this.members = this.members.filter((user) => user.userID !== _user.userID);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  close(): void {
    this.dialogRef.close(this.project);
  }
}
