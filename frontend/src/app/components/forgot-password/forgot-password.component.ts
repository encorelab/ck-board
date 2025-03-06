import { Component } from '@angular/core';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  email: string = '';
  message: string = '';
  invalidCredentials = false;

  constructor(private userService: UserService) {}

  onSubmit() {
    this.userService
      .requestPasswordReset(this.email)
      .then(() => {
        this.invalidCredentials = false;
        this.message =
          'If an account with that email exists, a password reset link has been sent.';
        this.email = '';
      })
      .catch((error) => {
        this.invalidCredentials = true;
        this.message = 'An error occurred. Please try again later.';
        console.error(error);
        this.email = '';
      });
  }
}
