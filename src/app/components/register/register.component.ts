import { Component } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFireAuth } from '@angular/fire/auth';
import { FormControl, Validators } from '@angular/forms';
import { UserService } from 'src/app/services/user.service';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';
import User from 'src/app/models/user';
import { Router } from '@angular/router';

enum UserType { STUDENT = 'student', TEACHER = 'teacher' }
enum Step { CHOOSE_TYPE, ADD_CREDENTIALS }

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

  username: string
  email: string
  password: string
  userType = UserType.STUDENT
  UserType: typeof UserType = UserType
  step = Step.CHOOSE_TYPE

  usernameControl = new FormControl('', [Validators.required, Validators.maxLength(25)]);
  emailControl = new FormControl('', [Validators.required, Validators.email])
  passwordControl = new FormControl('', [Validators.required, Validators.minLength(12), Validators.maxLength(30)]);
  matcher = new MyErrorStateMatcher();

  userService: UserService;

  constructor(db: AngularFireDatabase, public afAuth: AngularFireAuth, private route: Router) {
    this.userService = new UserService(db);
  }

  onRegister() {
    this.afAuth.createUserWithEmailAndPassword(this.email, this.password)
    .then((userCredential) => {
      var user = userCredential.user
      if (user) {
        var userModel: User = {
          email: this.email,
          username: this.username,
          role: this.userType
        };
        this.userService.create(userModel)
        this.route.navigate(['/canvas'])
      }
    })
    .catch((error) => {
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(errorCode + ': ' + errorMessage)
    });
  }
}
