import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserService } from 'src/app/services/user.service';
import { Project } from 'src/app/models/project';
import { FileUploadService } from 'src/app/services/fileUpload.service';
import { TAG_DEFAULT_COLOR } from 'src/app/utils/constants';
import { Tag } from 'src/app/models/tag';
import Utils from 'src/app/utils/Utils';
import { FabricUtils, ImageSettings } from 'src/app/utils/FabricUtils';
import { fabric } from 'fabric';
import { BoardPermissions } from 'src/app/models/board';

@Component({
  selector: 'app-add-board-modal',
  templateUrl: './add-board-modal.component.html',
  styleUrls: ['./add-board-modal.component.scss'],
})
export class AddBoardModalComponent implements OnInit {
  readonly tagDefaultColor = TAG_DEFAULT_COLOR;

  boardID: string;

  permissions: BoardPermissions;

  boardName = '';

  bgImgURL: any = null;
  bgImgSettings: ImageSettings;

  taskTitle = '';
  taskMessage = '';

  tags: Tag[] = [];
  defaultTags: Tag[];

  newTagText = '';
  newTagColor: any = TAG_DEFAULT_COLOR;

  initialZoom = 100;

  projects: Project[];
  selectedProject = '';

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
      showBucketStudent: true,
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

  async compressFile() {
    const image = await this.fileUploadService.compressFile();
    this.bgImgURL = await this.fileUploadService.upload(image);
    fabric.Image.fromURL(this.bgImgURL, async (image) => {
      this.bgImgSettings = this.fabricUtils.createImageSettings(image);
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
        bgImage: this.bgImgURL
          ? { url: this.bgImgURL, imgSettings: this.bgImgSettings }
          : null,
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
