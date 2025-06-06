import { Component } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { UserService } from 'src/app/services/user.service';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';
import { Router } from '@angular/router';
import User, { Role } from 'src/app/models/user';
import Utils, { generateUniqueID } from 'src/app/utils/Utils';

enum Step {
  CHOOSE_TYPE,
  ADD_CREDENTIALS,
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  username: string;
  email: string;
  password: string;
  role = Role.STUDENT;
  Role: typeof Role = Role;
  step = Step.CHOOSE_TYPE;

  usernameControl = new UntypedFormControl('', [
    Validators.required,
    Validators.maxLength(25),
  ]);
  emailControl = new UntypedFormControl('', [
    Validators.required,
    Validators.email,
  ]);
  passwordControl = new UntypedFormControl('', [
    Validators.required,
    Validators.minLength(12),
    Validators.maxLength(30),
  ]);
  invalidCredentials = false;
  emailExists = false;
  matcher = new MyErrorStateMatcher();

  constructor(public userService: UserService, private router: Router) {
    if (userService.loggedIn) this.router.navigate(['/dashboard']);
  }

  onRegister() {
    this.invalidCredentials = false;

    const user: User = {
      userID: generateUniqueID(),
      email: this.email,
      username: this.username,
      password: this.password,
      role: this.role,
    };

    this.userService
      .register(user)
      .then(() => this.router.navigate(['dashboard']))
      .catch((error) => {
        // Check the error message from the server
        if (error && error.message === 'Email already in use.') {
          this.emailExists = true;
        } else {
          this.invalidCredentials = true;
        }
      });
  }
}
