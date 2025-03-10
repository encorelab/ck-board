// custom-teacher-prompt-modal.component.ts
import { Component, Inject, OnInit } from '@angular/core'; // Import OnInit
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';

@Component({
  selector: 'app-custom-teacher-prompt-modal',
  templateUrl: './custom-teacher-prompt-modal.component.html',
  styleUrls: ['./custom-teacher-prompt-modal.component.scss'],
})
export class CustomTeacherPromptModalComponent implements OnInit { // Implement OnInit
  prompt: string = '';

  constructor(
    public dialogRef: MatDialogRef<CustomTeacherPromptModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { prompt: string } // Type the data
  ) {}

  ngOnInit(): void {
    // Initialize the prompt with the value from data, if provided
    if (this.data && this.data.prompt) {
      this.prompt = this.data.prompt;
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close(this.prompt);
  }
}