import { Component } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { FormControl, Validators } from '@angular/forms';
import { UserService } from 'src/app/services/user.service';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';

enum UserType { STUDENT, TEACHER }
enum Step { CHOOSE_TYPE, ADD_CREDENTIALS }

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

  username: string
  password: string
  userType = UserType.STUDENT
  step = Step.CHOOSE_TYPE

  usernameControl = new FormControl('', [Validators.required, Validators.maxLength(25)]);
  passwordControl = new FormControl('', [Validators.required, Validators.minLength(12), Validators.maxLength(30)]);
  matcher = new MyErrorStateMatcher();

  userService: UserService;

  constructor(db: AngularFireDatabase) {
    this.userService = new UserService(db);
  }

  onRegister() {

  }
}
