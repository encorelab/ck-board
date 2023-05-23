import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  email: string;
  password: string;

  matcher = new MyErrorStateMatcher();

  invalidCredentials = false;

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    if (this.userService.loggedIn) this.router.navigate(['/dashboard']);
  }

  onLogin(): void {
    this.userService
      .login(this.email, this.password)
      .then(async () => {
        this.invalidCredentials = false;
        const redirectUrl = this.userService.redirectUrl;
        this.userService.redirectUrl = null;
        if (redirectUrl) {
          // Parse query parameters (if they exist)
          const searchParams =
            redirectUrl.indexOf('?') != -1
              ? new URLSearchParams(
                  redirectUrl.substring(redirectUrl.indexOf('?'))
                )
              : [];

          this.router.navigate([`${redirectUrl.split('?')[0]}`], {
            queryParams: [...searchParams].reduce((o, [key, value]) => {
              o[key] = value;
              return o;
            }, {}),
            queryParamsHandling: 'merge',
          });
        } else {
          this.router.navigate(['dashboard']);
        }
      })
      .catch(() => {
        this.invalidCredentials = true;
      });
  }
}
