// src/app/components/show-join-code/show-join-code.component.ts
import { Component, Inject } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';

@Component({
  selector: 'app-show-join-code',
  templateUrl: './show-join-code.component.html',
  styleUrls: ['./show-join-code.component.scss']
})
export class ShowJoinCodeComponent {
  constructor(
    public dialogRef: MatDialogRef<ShowJoinCodeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { joinCode: string }
  ) {}

  close(): void {
     this.dialogRef.close();
  }
}