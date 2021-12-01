import { E } from '@angular/cdk/keycodes';
import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({ 
    templateUrl: 'password-reset.component.html', 
    styleUrls: ['./password-reset.component.scss']
})
export class PasswordResetComponent{

    email: string
    mode: string

    constructor(private auth: AuthService) {}

    onReset() {
        if (!this.email) { 
            this.mode = "Missing Email";
          }
        else {
          this.auth.resetPassword(this.email) 
          .then(
            () => this.mode = "Success", 
            () => this.mode = "Wrong Email"); 
        }
    }
}