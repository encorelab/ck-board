import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { fabric } from 'fabric';
import { PersonalBoardSetting } from 'src/app/models/project';
import { FileUploadService } from 'src/app/services/fileUpload.service';
import { UserService } from 'src/app/services/user.service';
import { FabricUtils, ImageSettings } from 'src/app/utils/FabricUtils';
import { generateCode, generateUniqueID } from 'src/app/utils/Utils';

@Component({
  selector: 'app-add-project-modal',
  templateUrl: './add-project-modal.component.html',
  styleUrls: ['./add-project-modal.component.scss'],
})
export class AddProjectModalComponent implements OnInit {
  name = '';

  personalBoardSetting: PersonalBoardSetting = {
    enabled: false,
    bgImage: null,
  };

  constructor(
    public dialogRef: MatDialogRef<AddProjectModalComponent>,
    public fabricUtils: FabricUtils,
    public userService: UserService,
    public fileUploadService: FileUploadService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {}

  async compressFile() {
    const image = await this.fileUploadService.compressFile();
    const url = await this.fileUploadService.upload(image);
    fabric.Image.fromURL(url, async (image) => {
      const imgSettings = this.fabricUtils.createImageSettings(image);
      this.personalBoardSetting.bgImage = { url, imgSettings };
    });
  }

  removeBgImg() {
    this.personalBoardSetting.bgImage = null;
  }

  handleDialogSubmit() {
    const projectID = generateUniqueID();
    this.data.createProject({
      projectID: projectID,
      teacherIDs: [this.data.user.userID],
      name: this.name,
      members: [this.data.user.userID],
      boards: [],
      studentJoinCode: generateCode(5).toString(),
      teacherJoinCode: generateCode(5).toString(),
      personalBoardSetting: this.personalBoardSetting,
    });
    this.dialogRef.close();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
