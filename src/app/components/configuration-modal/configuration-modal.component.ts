import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-configuration-modal',
  templateUrl: './configuration-modal.component.html',
  styleUrls: ['./configuration-modal.component.scss']
})
export class ConfigurationModalComponent {

  allowStudentMoveAny: boolean

  boardName: string
  taskTitle: string
  taskMessage: string
  bgImgURL: any

  constructor(
    public dialogRef: MatDialogRef<ConfigurationModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
      this.allowStudentMoveAny = data.board.permissions.allowStudentMoveAny
      this.boardName = data.board.name
      this.taskTitle = data.board.task.title
      this.taskMessage = data.board.task.message
    }

  handleImageUpload(e) {
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.onload = (f) => {
        this.bgImgURL = f.target?.result;
    };
    reader.readAsDataURL(file);
  }

  handleDialogSubmit() {
    if (this.bgImgURL) this.data.updateBackground(this.bgImgURL)
    this.data.updateBoardName(this.boardName)
    this.data.updateTask(this.taskTitle, this.taskMessage)
    this.data.updatePermissions(this.allowStudentMoveAny)

    this.dialogRef.close();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
