import { Component, Inject, OnInit } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';

export interface ConfirmModalData {
  title: string;
  message?: string;
  handleConfirm?: Function;
  handleCancel?: Function;
  confirmLabel?: string;
  cancelLabel?: string;
}

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss'],
})
export class ConfirmModalComponent implements OnInit {
  title: string;
  message?: string;

  constructor(
    public dialogRef: MatDialogRef<ConfirmModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmModalData
  ) {
    this.title = data.title;
    this.message = data.message;
  }

  ngOnInit(): void {}

  handleConfirm() {
    if (this.data.handleConfirm) {
      this.data.handleConfirm();
    }
  }

  handleCancel() {
    if (this.data.handleCancel) {
      this.data.handleCancel();
    }
  }
}
