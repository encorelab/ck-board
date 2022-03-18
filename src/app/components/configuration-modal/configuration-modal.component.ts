import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BoardService } from 'src/app/services/board.service';
import { Permissions } from 'src/app/models/permissions';
import { UserService } from 'src/app/services/user.service';
import { Tag } from 'src/app/models/post';
import { TAG_DEFAULT_COLOR } from 'src/app/utils/constants';

@Component({
  selector: 'app-configuration-modal',
  templateUrl: './configuration-modal.component.html',
  styleUrls: ['./configuration-modal.component.scss']
})
export class ConfigurationModalComponent {
  readonly tagDefaultColor = TAG_DEFAULT_COLOR;

  boardName: string
  isPublic: boolean = false

  currentBgImage: any 

  taskTitle: string
  taskMessage: string

  permissions: Permissions

  tags: Tag[]
  newTagText: string = ''
  newTagColor: any = TAG_DEFAULT_COLOR;

  members: string[] = []

  constructor(
    public dialogRef: MatDialogRef<ConfigurationModalComponent>,
    public boardService: BoardService,
    public userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
      this.boardName = data.board.name
      this.isPublic = data.board.public
      this.currentBgImage = data.board.bgImage
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
    this.tags.push({name: this.newTagText, color: this.newTagColor})
    this.newTagText = ''
  }

  removeTag(tagRemove) {
    this.tags = this.tags.filter(tag => tag != tagRemove)
  }

  handleImageUpload(e) {
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.onload = (f) => {
        this.currentBgImage = { url: f.target?.result };
        this.data.updateBackground(this.currentBgImage.url)
    };
    reader.readAsDataURL(file);
  }

  removeImage() {
    this.currentBgImage = null
    this.data.updateBackground(null)
  }

  handleDialogSubmit() {
    this.data.updateBoardName(this.boardName)
    this.data.updateTask(this.taskTitle, this.taskMessage)
    this.data.updatePermissions(this.permissions)
    this.data.updateTags(this.tags)
    this.dialogRef.close();
  }

  resetColor() {
    this.newTagColor = TAG_DEFAULT_COLOR;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
