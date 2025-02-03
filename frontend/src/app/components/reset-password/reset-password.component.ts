import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  token: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  message: string = '';

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        // Handle invalid or missing token (e.g., redirect to forgot password page)
        this.router.navigate(['/forgot-password']);
      }
    });
  }

  onSubmit() {
    if (this.newPassword !== this.confirmPassword) {
      this.message = 'Passwords do not match.';
      return;
    }

    this.userService.resetPassword(this.token, this.newPassword)
      .then(() => {
        this.message = 'Password reset successfully. Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      })
      .catch(error => {
        this.message = 'An error occurred. Please try again later.';
        console.error(error);
      });
  }
}