import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  email: string;
  password: string;

  matcher = new MyErrorStateMatcher();

  invalidCredentials = false;

  constructor(private userService: UserService, private router: Router) {
    if (this.userService.loggedIn) this.router.navigate(['/dashboard']);
  }

  onLogin() {
    this.userService
      .login(this.email, this.password)
      .then(() => {
        this.invalidCredentials = false;
        this.router.navigate(['dashboard']);
      })
      .catch(() => {
        this.invalidCredentials = true;
      });
  }
}
