import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-add-board-modal',
  templateUrl: './add-board-modal.component.html',
  styleUrls: ['./add-board-modal.component.scss']
})
export class AddBoardModalComponent implements OnInit {

  allowStudentMoveAny: boolean = true

  boardName: string = ''
  taskTitle: string = ''
  taskMessage: string = ''
  bgImgURL: any = ''

  constructor(
    public dialogRef: MatDialogRef<AddBoardModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit(): void {}

  handleImageUpload(e) {
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.onload = (f) => {
        this.bgImgURL = f.target?.result;
    };
    reader.readAsDataURL(file);
  }

  handleDialogSubmit() {
    this.data.createBoard({
      boardID: Date.now() + '-' + this.data.user.id,
      teacherID: this.data.user.id,
      name: this.boardName,
      task: {
        title: this.taskTitle,
        message: this.taskMessage
      },
      bgImage: {
        url: this.bgImgURL
      },
      permissions: {
        allowStudentMoveAny: this.allowStudentMoveAny
      },
      members: []
    })
    this.dialogRef.close();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
