import { Component, Inject, OnInit } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';
import { Utils } from 'src/app/utils/Utils';

@Component({
  selector: 'app-add-board-modal',
  templateUrl: './add-board-modal.component.html',
  styleUrls: ['./add-board-modal.component.scss']
})
export class AddBoardModalComponent implements OnInit {
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  allowStudentMoveAny: boolean = true

  boardName: string = ''
  isPublic: boolean = false
  bgImgURL: any = ''

  taskTitle: string = ''
  taskMessage: string = ''
  
  tags: string[] = []
  newTagText: string = ''

  constructor(
    public dialogRef: MatDialogRef<AddBoardModalComponent>,
    public authService: AuthService,
    public userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit(): void {}

  addTag() {
    this.tags.push(this.newTagText)
    this.newTagText = ''
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
    const boardID = Date.now() + '-' + this.data.user.id
    this.data.createBoard({
      boardID: boardID,
      teacherID: this.data.user.id,
      name: this.boardName,
      public: this.isPublic,
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
      members: [this.authService.userData.id],
      tags: this.tags,
      joinCode: Utils.generateCode(5).toString()
    })
    this.dialogRef.close();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
