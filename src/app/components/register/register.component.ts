import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { UserService } from 'src/app/services/user.service';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';
import { AngularFirestore } from '@angular/fire/firestore';
import { AuthService } from 'src/app/services/auth.service';
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
  invalidCredentials: boolean = false;
  matcher = new MyErrorStateMatcher();

  userService: UserService;

  constructor(db: AngularFirestore, public auth: AuthService, private router: Router) {
    this.auth.getAuthenticatedUser().then((user) => {
      if (user) {
        this.router.navigate(['/dashboard'])
      }
    })
    this.userService = new UserService(db);
  }

  onRegister() {
    this.invalidCredentials = false
    this.auth.register(this.userType, this.username, this.email, this.password)
      .catch(() => this.invalidCredentials = true)
  }
}
