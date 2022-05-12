import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BoardService } from 'src/app/services/board.service';
import { Permissions } from 'src/app/models/permissions';
import { UserService } from 'src/app/services/user.service';
import { FileUploadService } from 'src/app/services/fileUpload.service';
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

  currentBgImage: any 

  taskTitle: string
  taskMessage: string

  permissions: Permissions

  tags: Tag[]
  newTagText: string = ''
  newTagColor: any = TAG_DEFAULT_COLOR;
  initialZoom: number = 100

  members: string[] = []

  constructor(
    public dialogRef: MatDialogRef<ConfigurationModalComponent>,
    public boardService: BoardService,
    public userService: UserService,
    public fileUploadService: FileUploadService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
      this.boardName = data.board.name
      this.currentBgImage = data.board.bgImage
      this.taskTitle = data.board.task.title
      this.taskMessage = data.board.task.message
      this.tags = data.board.tags ?? []
      this.permissions= data.board.permissions
      this.initialZoom = data.board.initialZoom
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

  async compressFile(){
    let compressedImage = await this.fileUploadService.compressFile();
    await this.data.updateBackgroundImage(compressedImage);
    this.dialogRef.close();
  
  }

  removeImage() {
    this.currentBgImage = null
    this.data.removeBackgroundImage()
  }

  handleDialogSubmit() {
    this.data.updateBoardName(this.boardName)
    this.data.updateTask(this.taskTitle, this.taskMessage)
    this.data.updatePermissions(this.permissions)
    this.data.updateTags(this.tags)
    this.data.updateInitialZoom(this.initialZoom)
    this.dialogRef.close();
  }

  resetColor() {
    this.newTagColor = TAG_DEFAULT_COLOR;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
