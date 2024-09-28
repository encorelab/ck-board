import { Component, Inject, OnInit } from '@angular/core';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
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
  members: User[] = [];
  user: User;

  nameEditable: string = '';
  membershipDisabledEditable: boolean = false;

  Role: typeof Role = Role;

  constructor(
    public dialogRef: MatDialogRef<ProjectConfigurationModalComponent>,
    public boardService: BoardService,
    public userService: UserService,
    public projectService: ProjectService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Ensure data is properly checked and defaults are set
    this.project = data?.project ?? new Project(); // Assuming Project has a default constructor
    this.user = data?.user ?? new User(); // Assuming User has a default constructor
    this.nameEditable = this.project.name ?? '';
    this.membershipDisabledEditable = this.project.membershipDisabled ?? false;
  }

  async ngOnInit() {
    if (this.project.members && this.project.members.length > 0) {
      try {
        const members = await this.userService.getMultipleByIds(
          this.project.members
        );
        this.members = (members ?? []).sort(
          (a, b) => b.role.charCodeAt(0) - a.role.charCodeAt(0)
        );
      } catch (error) {
        console.error('Error fetching members:', error);
        // Handle error as needed
      }
    } else {
      console.error('No members found for the project');
      // Handle the case where no members are found
    }
  }

  async handleDialogSubmit() {
    try {
      this.project =
        (await this.projectService.update(this.project.projectID, {
          name: this.nameEditable,
          membershipDisabled: this.membershipDisabledEditable,
          members: this.members.map((user) => user.userID),
        })) ?? this.project; // Default to current project if update fails
      this.close();
    } catch (error) {
      console.error('Error updating project:', error);
      // Handle the error as needed
    }
  }

  async removeUser(_user: User) {
    this.members = (this.members ?? []).filter(
      (user) => user.userID !== _user.userID
    );
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  close(): void {
    this.dialogRef.close(this.project);
  }
}
