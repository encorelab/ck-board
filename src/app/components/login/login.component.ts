import { Component } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';
import { FormControl, Validators } from '@angular/forms';
import { UserService } from 'src/app/services/user.service';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  username: string
  password: string

  usernameControl = new FormControl('', [Validators.required]);
  passwordControl = new FormControl('', [Validators.required]);
  matcher = new MyErrorStateMatcher();
  
  userService: UserService;

  constructor(db: AngularFireDatabase) {
    this.userService = new UserService(db);
  }

  onLogin() {
    
  }
}
