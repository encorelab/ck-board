import { Component, Inject } from '@angular/core';
import { FormControl, FormGroupDirective, NgForm, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogInterface } from 'src/app/interfaces/dialog.interface';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss']
})
export class DialogComponent {

  title: string 
  description: string 
  titleControl = new FormControl('', [Validators.required, Validators.maxLength(50)]);
  descControl = new FormControl('', [Validators.maxLength(1000)]);
  matcher = new MyErrorStateMatcher();

  constructor(
    public dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogInterface) {}

  handleDialogSubmit() {
    this.data.addPost(this.title, this.description, this.data.left, this.data.top);
    this.dialogRef.close();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
