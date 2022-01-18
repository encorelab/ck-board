import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  email: string
  password: string

  matcher = new MyErrorStateMatcher();

  invalidCredentials: boolean = false;

  constructor(private auth: AuthService, private router: Router) {
    this.auth.getAuthenticatedUser().then((user) => {
      if (user) {
        this.router.navigate(['/dashboard'])
      }
    })
  }

  onLogin() {
    this.auth.login(this.email, this.password).then((userCredential) => {
      this.invalidCredentials = false;
    }).catch((error) => {
      this.invalidCredentials = true;
    });
  }
}
