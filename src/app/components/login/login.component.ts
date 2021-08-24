import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase } from '@angular/fire/database';
import { FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
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

  userService: UserService;

  constructor(db: AngularFireDatabase, public afAuth: AngularFireAuth, private route: Router) {
    this.userService = new UserService(db);
  }

  onLogin() {
    this.afAuth.signInWithEmailAndPassword(this.email, this.password)
    .then((userCredential) => {
      this.invalidCredentials = false;
      this.route.navigate(['/canvas'])
    })
    .catch((error) => {
      this.invalidCredentials = true;
    });
  }
}
