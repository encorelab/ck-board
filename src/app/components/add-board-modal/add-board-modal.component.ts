import { Component, Inject, OnInit } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatChipInputEvent } from '@angular/material/chips';

@Component({
  selector: 'app-add-board-modal',
  templateUrl: './add-board-modal.component.html',
  styleUrls: ['./add-board-modal.component.scss']
})
export class AddBoardModalComponent implements OnInit {
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  allowStudentMoveAny: boolean = true

  boardName: string = ''
  taskTitle: string = ''
  taskMessage: string = ''
  bgImgURL: any = ''

  tags: string[] = []

  constructor(
    public dialogRef: MatDialogRef<AddBoardModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit(): void {}

  addTag(event: MatChipInputEvent) {
    if (event.value)
      this.tags.push(event.value)
    event.chipInput!.clear();
  }

  removeTag(tagRemove) {
    this.tags = this.tags.filter(tag => tag != tagRemove)
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
      members: [],
      tags: this.tags
    })
    this.dialogRef.close();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
