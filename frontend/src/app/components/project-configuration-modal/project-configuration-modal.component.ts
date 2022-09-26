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

  nameEditable: string;
  membershipDisabledEditable: boolean;

  Role: typeof Role = Role;

  constructor(
    public dialogRef: MatDialogRef<ProjectConfigurationModalComponent>,
    public boardService: BoardService,
    public userService: UserService,
    public projectService: ProjectService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.project = data.project;
    this.nameEditable = this.project.name;
    this.membershipDisabledEditable = this.project.membershipDisabled;
  }

  async ngOnInit() {
    this.members = (
      await this.userService.getMultipleByIds(this.project.members)
    ).sort((a, b) => b.role.charCodeAt(0) - a.role.charCodeAt(0));
  }

  async handleDialogSubmit() {
    this.project = await this.projectService.update(this.project.projectID, {
      name: this.nameEditable,
      membershipDisabled: this.membershipDisabledEditable,
    });
    this.close();
  }

  onNoClick(): void {
    this.close();
  }

  close(): void {
    this.dialogRef.close(this.project);
  }
}
