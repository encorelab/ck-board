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
      this.permissions = fb.group({
        studentMoveAnyPost: true,
        studentEditAnyPost: true,
        studentDeleteAnyPost: true,
      });
    }

  handleDialogSubmit() {
    this.data.callBack(this.data.message);
    this.dialogRef.close();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
