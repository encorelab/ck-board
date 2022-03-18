import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Permissions } from 'src/app/models/permissions';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';
import { Project } from 'src/app/models/project';
import { DEFAULT_TAGS, TAG_DEFAULT_COLOR } from 'src/app/utils/constants';
import { Tag } from 'src/app/models/post';

@Component({
  selector: 'app-add-board-modal',
  templateUrl: './add-board-modal.component.html',
  styleUrls: ['./add-board-modal.component.scss']
})
export class AddBoardModalComponent implements OnInit {
  readonly tagDefaultColor = TAG_DEFAULT_COLOR;

  permissions:Permissions

  boardName: string = ''
  bgImgURL: any = ''

  taskTitle: string = ''
  taskMessage: string = ''
  
  tags: Tag[] = [];
  defaultTags: Tag[] = DEFAULT_TAGS;
  newTagText: string = ''
  newTagColor: any = TAG_DEFAULT_COLOR;

  projects:Project[]
  selectedProject:string=''

  constructor(
    public dialogRef: MatDialogRef<AddBoardModalComponent>,
    public authService: AuthService,
    public userService: UserService,
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
      task: {
        title: this.taskTitle,
        message: this.taskMessage
      },
      bgImage: {
        url: this.bgImgURL
      },
      permissions:this.permissions,
      members: [this.authService.userData.id],
      tags: this.tags.concat(this.defaultTags),
    }, this.selectedProject)
    this.dialogRef.close();
  }

  resetColor() {
    this.newTagColor = TAG_DEFAULT_COLOR;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
