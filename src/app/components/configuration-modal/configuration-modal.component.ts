import { Component, Inject } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BoardService } from 'src/app/services/board.service';
import { MatChipInputEvent } from '@angular/material/chips';
import { Permissions } from 'src/app/models/permissions';
import { UserService } from 'src/app/services/user.service';
import {NgxImageCompressService} from "ngx-image-compress";

@Component({
  selector: 'app-configuration-modal',
  templateUrl: './configuration-modal.component.html',
  styleUrls: ['./configuration-modal.component.scss']
})
export class ConfigurationModalComponent {
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  boardName: string
  isPublic: boolean = false

  currentBgImage: any 

  taskTitle: string
  taskMessage: string

  permissions: Permissions

  tags: string[]
  newTagText: string = ''

  members: string[] = []

  constructor(
    public dialogRef: MatDialogRef<ConfigurationModalComponent>,
    public boardService: BoardService,
    public userService: UserService,
    private imageCompress: NgxImageCompressService,
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
    this.tags.push(this.newTagText)
    this.newTagText = ''
  }

  removeTag(tagRemove) {
    this.tags = this.tags.filter(tag => tag != tagRemove)
  }

  compressFile(){
    // Compresses file so that it does not exceed 2MB
    const MAX_BYTE = 2 * Math.pow(10,6);
    this.imageCompress.uploadFile().then(
      ({image, orientation}) => {
        console.log("Size in bytes before compression is : "+this.imageCompress.byteCount(image))

        if(this.imageCompress.byteCount(image) > MAX_BYTE){
          let compressAmount = (MAX_BYTE / this.imageCompress.byteCount(image)) *100
          console.log(compressAmount)
          this.imageCompress
          .compressFile(image, orientation, compressAmount, compressAmount)
          .then(
            (compressedImage) => {
              this.data.updateBackground(compressedImage,null);
              console.log("Size in bytes after compression is now:", this.imageCompress.byteCount(compressedImage));
            }
          );

        }
        else{
          this.data.updateBackground(image,null);
        }

        
      }
    );
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

  onNoClick(): void {
    this.dialogRef.close();
  }
}
