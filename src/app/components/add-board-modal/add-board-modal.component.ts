import { Component, Inject, OnInit } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Permissions } from 'src/app/models/permissions';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';
import { Utils } from 'src/app/utils/Utils';
import { Project } from 'src/app/models/project';
import {NgxImageCompressService} from "ngx-image-compress";
import { FileUploadService } from 'src/app/services/fileUpload.service';


@Component({
  selector: 'app-add-board-modal',
  templateUrl: './add-board-modal.component.html',
  styleUrls: ['./add-board-modal.component.scss']
})
export class AddBoardModalComponent implements OnInit {
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  permissions:Permissions

  boardName: string = ''
  bgImgURL: any = ''

  taskTitle: string = ''
  taskMessage: string = ''
  
  tags: string[] = []
  newTagText: string = ''
  projects:Project[]
  selectedProject:string=''

  constructor(
    public dialogRef: MatDialogRef<AddBoardModalComponent>,
    public authService: AuthService,
    public userService: UserService,
    public fileUploadService: FileUploadService,
    private imageCompress: NgxImageCompressService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
      this.permissions={
        allowStudentMoveAny:true,
        allowStudentLiking:true,
        allowStudentEditAddDeletePost:true,
        allowStudentCommenting:true,
        allowStudentTagging:true,
        showAuthorNameStudent:true,
        showAuthorNameTeacher:true
      }
      this.projects = data.projects
      this.selectedProject = data.defaultProject || ''
    }
  ngOnInit(): void {}

  addTag() {
    this.tags.push(this.newTagText)
    this.newTagText = ''
  }

  removeTag(tagRemove) {
    this.tags = this.tags.filter(tag => tag != tagRemove)
  }

  compressFile(){
    const MAX_MEGABYTE = 2;
    this.imageCompress
      .uploadAndGetImageWithMaxSize(MAX_MEGABYTE)
      .then(
        (result: string) => {
          this.fileUploadService.upload(result).then(firebaseUrl => {
            this.bgImgURL = firebaseUrl
          })
        },
        (result: string) => {
          console.error('The compression algorithm didn\'t succed! The best size we can do is', this.imageCompress.byteCount(result), 'bytes')
        });
  }

  handleDialogSubmit() {
    const boardID = Date.now() + '-' + this.data.user.id
    this.data.createBoard({
      boardID: boardID,
      teacherID: this.data.user.id,
      name: this.boardName,
      task: {
        title: this.taskTitle,
        message: this.taskMessage
      },
      bgImage: {
        url: this.bgImgURL
      },
      permissions:this.permissions,
      members: [this.authService.userData.id],
      tags: this.tags,
    }, this.selectedProject)
    this.dialogRef.close();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
