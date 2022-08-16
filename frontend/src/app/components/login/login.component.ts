import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';
import { TodoItemService } from '../../services/todoItem.service';

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

  constructor(
    private userService: UserService,
    private router: Router,
    private todoItemService: TodoItemService
  ) {
    if (this.userService.loggedIn) this.router.navigate(['/dashboard']);
  }

  onLogin() {
    this.userService
      .login(this.email, this.password)
      .then(async () => {
        this.invalidCredentials = false;
        const redirectUrl = this.userService.redirectUrl;
        this.userService.redirectUrl = null;
        if (redirectUrl) {
          this.router.navigate([redirectUrl]);
        } else {
          this.router.navigate(['dashboard']);
          await this.todoItemService.sendReminder();
        }
      })
      .catch(() => {
        this.invalidCredentials = true;
      });
  }
}
