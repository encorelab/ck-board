import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import Bucket from 'src/app/models/bucket';
import { BucketService } from 'src/app/services/bucket.service';

@Component({
  selector: 'app-create-workflow-modal',
  templateUrl: './create-workflow-modal.component.html',
  styleUrls: ['./create-workflow-modal.component.scss']
})
export class CreateWorkflowModalComponent implements OnInit {

  bucketName: string = ''

  constructor(
    public dialogRef: MatDialogRef<CreateWorkflowModalComponent>,
    public bucketService: BucketService,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
  }

  createBucket() {
    const bucket: Bucket = {
      bucketID: Date.now() + '-' + this.data.board.boardID,
      boardID: this.data.board.boardID,
      name: this.bucketName,
      posts: []
    }
    
    this.bucketService.create(bucket)
    this.dialogRef.close();
  }

  createWorkflow() {
    this.dialogRef.close()
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
