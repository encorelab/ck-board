import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { UserService } from 'src/app/services/user.service';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';
import { AngularFirestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import User, { Role } from 'src/app/models/user';
import Utils from 'src/app/utils/Utils';

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

  usernameControl = new FormControl('', [
    Validators.required,
    Validators.maxLength(25),
  ]);
  emailControl = new FormControl('', [Validators.required, Validators.email]);
  passwordControl = new FormControl('', [
    Validators.required,
    Validators.minLength(12),
    Validators.maxLength(30),
  ]);
  invalidCredentials = false;
  matcher = new MyErrorStateMatcher();

  constructor(public userService: UserService, private router: Router) {
    if (userService.loggedIn) this.router.navigate(['/dashboard']);
  }

  onRegister() {
    this.invalidCredentials = false;

    const user: User = {
      userID: Utils.generateUniqueID(),
      email: this.email,
      username: this.username,
      password: this.password,
      role: this.role,
    };

    this.userService
      .register(user)
      .then(() => this.router.navigate(['dashboard']))
      .catch(() => (this.invalidCredentials = true));
  }
}
