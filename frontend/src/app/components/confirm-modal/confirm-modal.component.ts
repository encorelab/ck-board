import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmModalData {
  title: string;
  message?: string;
  handleConfirm?: Function;
  handleCancel?: Function;
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
