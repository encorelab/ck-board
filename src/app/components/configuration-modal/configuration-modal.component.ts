import { Component, Inject } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BoardService } from 'src/app/services/board.service';
import { MatChipInputEvent } from '@angular/material/chips';
import { Permissions } from 'src/app/models/permissions';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-configuration-modal',
  templateUrl: './configuration-modal.component.html',
  styleUrls: ['./configuration-modal.component.scss']
})
export class ConfigurationModalComponent {
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  boardName: string
  bgImgURL: any

  taskTitle: string
  taskMessage: string

  permissions:Permissions

  tags: string[]
  newTagText: string = ''

  members: string[] = []

  constructor(
    public dialogRef: MatDialogRef<ConfigurationModalComponent>,
    public boardService: BoardService,
    public userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
      this.boardName = data.board.name
      this.taskTitle = data.board.task.title
      this.taskMessage = data.board.task.message
      this.tags = data.board.tags ?? []
      this.permissions= data.board.permissions
      data.board.members.map(id => {
        userService.getOneById(id).then(user => {
          if (user) {
            this.members.push(user.username)
          }
        })
      })
    }

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
    if (this.bgImgURL) this.data.updateBackground(this.bgImgURL)
    this.data.updateBoardName(this.boardName)
    this.data.updateTask(this.taskTitle, this.taskMessage)
    this.data.updatePermissions(this.permissions)
    this.data.updateTags(this.tags)
    this.dialogRef.close();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
