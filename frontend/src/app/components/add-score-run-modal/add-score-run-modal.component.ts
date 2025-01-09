
import { Component, OnInit, Inject } from '@angular/core';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
import { fabric } from 'fabric';
import { PersonalBoardSetting } from 'src/app/models/project';
// import { FileUploadService } from 'src/app/services/fileUpload.service';
import { UserService } from 'src/app/services/user.service';
import { FabricUtils, ImageSettings } from 'src/app/utils/FabricUtils';
import { generateCode, generateUniqueID } from 'src/app/utils/Utils';

@Component({
  selector: 'app-add-score-run-modal',
  templateUrl: './add-score-run-modal.component.html',
  styleUrls: ['./add-score-run-modal.component.scss']
})
export class AddScoreRunModalComponent implements OnInit {
  name = '';

  personalBoardSetting: PersonalBoardSetting = {
    enabled: false,
    bgImage: null,
  };
  membershipDisabledEditable = false;

  constructor(
    public dialogRef: MatDialogRef<AddScoreRunModalComponent>,
    public fabricUtils: FabricUtils,
    public userService: UserService,
    // public fileUploadService: FileUploadService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {}

  async compressFile() {
    // const image = await this.fileUploadService.compressFile();
    // const url = await this.fileUploadService.upload(image);
    // fabric.Image.fromURL(url, async (image) => {
    //   const imgSettings = this.fabricUtils.createImageSettings(image);
    //   this.personalBoardSetting.bgImage = { url, imgSettings };
    // });
  }

  removeBgImg() {
    this.personalBoardSetting.bgImage = null;
  }

  handleDialogSubmit() {
    const projectID = generateUniqueID();
    this.data.createProject({
      projectID: projectID,
      isScoreRun: true,
      teacherIDs: [this.data.user.userID],
      name: this.name,
      members: [this.data.user.userID],
      boards: [],
      studentJoinCode: generateCode(5).toString(),
      teacherJoinCode: generateCode(5).toString(),
      personalBoardSetting: this.personalBoardSetting,
      membershipDisabled: this.membershipDisabledEditable,
    });
    this.dialogRef.close();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
