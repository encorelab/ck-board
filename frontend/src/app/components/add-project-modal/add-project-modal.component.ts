import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserService } from 'src/app/services/user.service';
import Utils from 'src/app/utils/Utils';

@Component({
  selector: 'app-add-project-modal',
  templateUrl: './add-project-modal.component.html',
  styleUrls: ['./add-project-modal.component.scss'],
})
export class AddProjectModalComponent implements OnInit {
  name = '';

  constructor(
    public dialogRef: MatDialogRef<AddProjectModalComponent>,
    public userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {}

  handleDialogSubmit() {
    const projectID = Utils.generateUniqueID();
    this.data.createProject({
      projectID: projectID,
      teacherID: this.data.user.userID,
      name: this.name,
      members: [this.data.user.userID],
      boards: [],
      joinCode: Utils.generateCode(5).toString(),
    });
    this.dialogRef.close();
  }
  onNoClick(): void {
    this.dialogRef.close();
  }
}
