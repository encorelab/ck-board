import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Permissions } from 'src/app/models/permissions';
import { UserService } from 'src/app/services/user.service';
import { Project } from 'src/app/models/project';
import { FileUploadService } from 'src/app/services/fileUpload.service';
import { TAG_DEFAULT_COLOR } from 'src/app/utils/constants';
import { Tag } from 'src/app/models/post';
import Utils from 'src/app/utils/utils';
import { FabricUtils } from 'src/app/utils/FabricUtils';

@Component({
  selector: 'app-add-board-modal',
  templateUrl: './add-board-modal.component.html',
  styleUrls: ['./add-board-modal.component.scss'],
})
export class AddBoardModalComponent implements OnInit {
  readonly tagDefaultColor = TAG_DEFAULT_COLOR;

  boardID: string;

  permissions: Permissions;

  boardName: string = '';
  bgImgURL: any = null;

  taskTitle: string = '';
  taskMessage: string = '';

  tags: Tag[] = [];
  defaultTags: Tag[];

  newTagText: string = '';
  newTagColor: any = TAG_DEFAULT_COLOR;

  initialZoom: number = 100;

  projects: Project[];
  selectedProject: string = '';

  constructor(
    public dialogRef: MatDialogRef<AddBoardModalComponent>,
    public UserService: UserService,
    public userService: UserService,
    public fileUploadService: FileUploadService,
    public fabricUtils: FabricUtils,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.permissions = {
      allowStudentMoveAny: true,
      allowStudentLiking: true,
      allowStudentEditAddDeletePost: true,
      allowStudentCommenting: true,
      allowStudentTagging: true,
      showAuthorNameStudent: true,
      showAuthorNameTeacher: true,
    };
    this.projects = data.projects;
    this.selectedProject = data.defaultProject || '';
  }

  ngOnInit(): void {
    this.boardID = Utils.generateUniqueID();
    this.defaultTags = this.fabricUtils.getDefaultTagsForBoard(this.boardID);
  }

  addTag() {
    this.tags.push({
      boardID: this.boardID,
      name: this.newTagText,
      color: this.newTagColor,
    });
    this.newTagText = '';
  }

  removeTag(tagRemove) {
    this.tags = this.tags.filter((tag) => tag != tagRemove);
  }

  compressFile() {
    this.fileUploadService.compressFile().then((compressedImage) => {
      this.fileUploadService.upload(compressedImage).then((firebaseUrl) => {
        this.bgImgURL = firebaseUrl;
      });
    });
  }

  handleDialogSubmit() {
    this.data.createBoard(
      {
        boardID: this.boardID,
        teacherID: this.data.user.userID,
        name: this.boardName,
        task: {
          title: this.taskTitle,
          message: this.taskMessage,
        },
        bgImage: this.bgImgURL ? { url: this.bgImgURL } : null,
        permissions: this.permissions,
        members: [this.userService.user?.userID],
        tags: this.tags.concat(this.defaultTags),
        initialZoom: this.initialZoom,
      },
      this.selectedProject
    );
    this.dialogRef.close();
  }

  resetColor() {
    this.newTagColor = TAG_DEFAULT_COLOR;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
