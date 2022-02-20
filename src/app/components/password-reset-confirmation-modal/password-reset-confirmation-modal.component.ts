import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-password-reset-confirmation-modal',
  templateUrl: './password-reset-confirmation-modal.component.html',
  styleUrls: ['./password-reset-confirmation-modal.component.scss']
})
export class PasswordResetConfirmationModalComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<PasswordResetConfirmationModalComponent>, private router: Router) { }

  ngOnInit(): void {
  }

  onAcknowledgeClick(): void {
    this.dialogRef.close();
    this.router.navigate(['/login']);
}

}
