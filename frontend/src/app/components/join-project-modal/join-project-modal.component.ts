import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ProjectService } from 'src/app/services/project.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-join-project-modal',
  templateUrl: './join-project-modal.component.html',
  styleUrls: ['./join-project-modal.component.scss'],
})
export class JoinProjectModalComponent implements OnInit {
  inputCode = '';
  isError = false;
  errorMessage = '';

  constructor(
    public dialogRef: MatDialogRef<JoinProjectModalComponent>,
    public projectService: ProjectService,
    public userService: UserService,
    public router: Router,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {}

  joinProject() {
    this.projectService
      .joinProject(this.inputCode, this.userService.user!.userID)
      .then((project) => {
        this.dialogRef.close();
        this.router.navigate(['project/' + project.projectID]);
      })
      .catch((e) => this.showError(e));
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  showError(message) {
    this.isError = true;
    this.errorMessage = message;
  }
}
