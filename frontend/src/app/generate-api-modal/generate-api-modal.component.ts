import { Component, Inject } from '@angular/core';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
@Component({
  selector: 'app-generate-api-modal',
  templateUrl: './generate-api-modal.component.html',
  styleUrls: ['./generate-api-modal.component.scss'],
})
export class GenerateApiModalComponent {
  apiKey: string;

  constructor(
    public dialogRef: MatDialogRef<string>,
    @Inject(MAT_DIALOG_DATA) public data: string
  ) {
    this.apiKey = data;
  }

  copyApiKey() {
    navigator.clipboard
      .writeText(this.apiKey)
      .then(() => {
        console.log('API key copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy API key: ', err);
      });
  }
}
