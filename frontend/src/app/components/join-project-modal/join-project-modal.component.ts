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
      .getByJoinCode(this.inputCode)
      .then((project) => {
        if (project) {
          const members: string[] = project.members;
          const userID = this.userService.user!.userID;
          if (members.includes(userID)) {
            this.showError('You already joined this board!');
          } else {
            members.push(userID);
            this.projectService
              .update(project.projectID, { members: members })
              .then((_) => {
                this.dialogRef.close();
                this.router.navigate(['project/' + project.projectID]);
              })
              .catch((_) =>
                this.showError('Something went wrong trying to join!')
              );
          }
        } else {
          this.showError('Invalid Code!');
        }
      })
      .catch((_) => this.showError('Please try again!'));
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  showError(message) {
    this.isError = true;
    this.errorMessage = message;
  }
}
