import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {
  token: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  message: string = '';

  passwordControl = new UntypedFormControl('', [
    Validators.required,
    Validators.minLength(12),
    Validators.maxLength(30),
  ]);
  matcher = new MyErrorStateMatcher();
  invalidCredentials = false;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.token = params['token'];
      if (!this.token) {
        // Handle invalid or missing token (e.g., redirect to forgot password page)
        this.router.navigate(['/forgot-password']);
      }
    });
  }

  onSubmit() {
    if (this.newPassword.length < 12 || this.newPassword.length > 30) {
      this.invalidCredentials = true;
      this.message =
        'Unable to change the password. Password must be between 12 and 30 characters.';
      return;
    }

    if (this.newPassword != this.confirmPassword) {
      this.invalidCredentials = true;
      this.message = 'Passwords do not match.';
      return;
    }

    this.userService
      .resetPassword(this.token, this.newPassword)
      .then(() => {
        this.message = 'Password reset successfully. Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      })
      .catch((error) => {
        this.message = 'An error occurred. Please try again later.';
        console.error(error);
      });
  }
}
