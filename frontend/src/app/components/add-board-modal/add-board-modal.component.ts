import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import { fabric } from 'fabric';
import {
  BoardPermissions,
  BoardScope,
  BoardType,
  ViewSettings,
  ViewType,
} from 'src/app/models/board';
import { Project } from 'src/app/models/project';
import { Tag } from 'src/app/models/tag';
import { FileUploadService } from 'src/app/services/fileUpload.service';
import { UserService } from 'src/app/services/user.service';
import { FabricUtils, ImageSettings } from 'src/app/utils/FabricUtils';
import { generateUniqueID } from 'src/app/utils/Utils';
import { TAG_DEFAULT_COLOR } from 'src/app/utils/constants';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-add-board-modal',
  templateUrl: './add-board-modal.component.html',
  styleUrls: ['./add-board-modal.component.scss'],
})
export class AddBoardModalComponent implements OnInit {
  readonly tagDefaultColor = TAG_DEFAULT_COLOR;

  boardID: string = '';

  permissions: BoardPermissions;
  boardType: BoardType = BoardType.BRAINSTORMING;

  defaultView: ViewType = ViewType.BUCKETS;
  viewSettings: ViewSettings;

  boardName = '';
  boardScope = BoardScope.PROJECT_SHARED;

  bgImgURL: any = null;
  bgImgSettings: ImageSettings;

  taskTitle = '';
  taskMessage = '';

  tags: Tag[] = [];
  defaultTags: Tag[];

  newTagText = '';
  newTagColor: any = TAG_DEFAULT_COLOR;

  initialZoom = 100;
  backgroundSize = 100;
  backgroundPosX = 0;
  backgroundPosY = 0;
  upvoteLimit = 5;

  projects: Project[];
  selectedProject = '';
  selectedFile: File | null = null; // File to upload

  constructor(
    public dialogRef: MatDialogRef<AddBoardModalComponent>,
    public userService: UserService,
    public fileUploadService: FileUploadService,
    public fabricUtils: FabricUtils,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.permissions = {
      allowStudentMoveAny: true,
      allowStudentUpvoting: true,
      allowStudentEditAddDeletePost: true,
      allowStudentCommenting: true,
      allowStudentTagging: true,
      showAuthorNameStudent: true,
      showAuthorNameTeacher: true,
      showBucketStudent: true,
      showSnackBarStudent: false,
      allowTracing: false,
    };
    this.viewSettings = {
      allowCanvas: true,
      allowWorkspace: true,
      allowBuckets: true,
      allowMonitor: true,
    };
    this.projects = data.projects;
    this.selectedProject = data.defaultProject || '';
  }

  ngOnInit(): void {
    this.boardID = generateUniqueID();
    this.defaultTags = this.fabricUtils.getDefaultTagsForBoard(this.boardID);
  }

  addTag() {
    this.tags.push({
      tagID: generateUniqueID(),
      boardID: this.boardID,
      name: this.newTagText,
      color: this.newTagColor,
    });
    this.newTagText = '';
  }

  removeTag(tagRemove) {
    this.tags = this.tags.filter((tag) => tag != tagRemove);
  }

  uploadImage(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();

    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        this.fileUploadService.uploadImage(file).subscribe({
          next: (response: any) => {
            console.log('Image uploaded successfully', response);
            this.bgImgURL =
              environment.ckboardDomain + '/api/image/' + response.imageUrl;
            fabric.Image.fromURL(this.bgImgURL, async (image) => {
              this.bgImgSettings = this.fabricUtils.createImageSettings(image);
            });
          },
          error: (error) => {
            console.error('Image upload failed', error);
          },
        });
      }
    };
  }

  onFileSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files) {
      this.selectedFile = fileInput.files[0]; // Get the selected file
    }
  }

  handleDialogSubmit() {
    this.data.createBoard(
      {
        projectID: this.selectedProject,
        boardID: this.boardID,
        ownerID: this.data.user.userID,
        name: this.boardName.trim(),
        scope: this.boardScope,
        task: {
          title: this.taskTitle,
          message: this.taskMessage,
        },
        bgImage: this.bgImgURL
          ? { url: this.bgImgURL, imgSettings: this.bgImgSettings }
          : null,
        permissions: this.permissions,
        type: this.boardType,
        tags: this.tags.concat(this.defaultTags),
        initialZoom: this.initialZoom,
        upvoteLimit: this.upvoteLimit,
        visible: true,
        defaultView: this.defaultView,
        viewSettings: this.viewSettings,
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
