import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-configuration-modal',
  templateUrl: './configuration-modal.component.html',
  styleUrls: ['./configuration-modal.component.scss']
})
export class ConfigurationModalComponent {

  permissions: FormGroup;
  boardName: string
  bgImgURL: any

  constructor(
    public dialogRef: MatDialogRef<ConfigurationModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, fb: FormBuilder) {
      this.permissions = fb.group({
        studentMoveAnyPost: data.allowStudentMoveAny,
      });
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
    if (this.bgImgURL) this.data.updateBackground(this.bgImgURL)
    if (this.boardName) this.data.updateBoardName(this.boardName)
    this.dialogRef.close();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  updatePermission(value) {
    const status = this.permissions.get(value)?.value
    this.data.updatePermissions(!status)
  }
}
