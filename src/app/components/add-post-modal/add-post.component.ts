import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogInterface } from 'src/app/interfaces/dialog.interface';
import { CanvasService } from 'src/app/services/canvas.service';
import { TracingService } from 'src/app/services/tracing.service';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';

@Component({
  selector: 'app-dialog',
  templateUrl: './add-post.component.html',
  styleUrls: ['./add-post.component.scss']
})
export class AddPostComponent {

  title: string = ''
  message: string = ''
  titleControl = new FormControl('', [Validators.required, Validators.maxLength(50)]);
  msgControl = new FormControl('', [Validators.maxLength(1000)]);
  matcher = new MyErrorStateMatcher();

  constructor(
    public dialogRef: MatDialogRef<AddPostComponent>,
    public tracingService: TracingService,
    @Inject(MAT_DIALOG_DATA) public data: DialogInterface, public canvasService: CanvasService) {}

  handleDialogSubmit() {
    this.canvasService.addPostClient(this.title, this.message, this.data);
    this.dialogRef.close();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
