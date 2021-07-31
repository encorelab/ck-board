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
  
  constructor(
    public dialogRef: MatDialogRef<ConfigurationModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any, fb: FormBuilder) {
      console.log(data.allowStudentMoveAny)
      this.permissions = fb.group({
        studentMoveAnyPost: data.allowStudentMoveAny,
      });
    }

  handleDialogSubmit() {
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
