import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Project } from 'src/app/models/project';
import { BoardService } from 'src/app/services/board.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-project-configuration-modal',
  templateUrl: './project-configuration-modal.component.html',
  styleUrls: ['./project-configuration-modal.component.scss'],
})
export class ProjectConfigurationModalComponent implements OnInit {
  projectName: string;
  projectID: string;
  project: Project;
  members: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<ProjectConfigurationModalComponent>,
    public boardService: BoardService,
    public userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.project = data.project;
    this.projectName = data.project.name;
    this.projectID = data.project.projectID;
    data.project.members.map((id) => {
      userService.getOneById(id).then((user) => {
        if (user) {
          this.members.push(user.username);
        }
      });
    });
  }
  handleDialogSubmit() {
    this.data.updateProjectName(this.project, this.projectID, this.projectName);
    this.dialogRef.close();
  }
  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit(): void {}
}
