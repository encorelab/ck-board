import { Component, Inject } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';

const linkifyStr = require('linkifyjs/lib/linkify-string');

@Component({
  selector: 'app-task-modal',
  templateUrl: './task-modal.component.html',
  styleUrls: ['./task-modal.component.scss'],
})
export class TaskModalComponent {
  title: string;
  message: string;

  constructor(
    public dialogRef: MatDialogRef<TaskModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.title = linkifyStr(data.title, {
      defaultProtocol: 'https',
      target: '_blank',
    });
    this.message = linkifyStr(data.message, {
      defaultProtocol: 'https',
      target: '_blank',
    });
  }

  ngOnInit(): void {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
