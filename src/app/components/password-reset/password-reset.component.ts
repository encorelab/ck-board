import { E } from '@angular/cdk/keycodes';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({ 
    templateUrl: 'password-reset.component.html', 
    styleUrls: ['./password-reset.component.scss']
})
export class PasswordResetComponent{

    email: string
    msg: string

    constructor(private auth: AuthService) {}

    onReset() {
        if (!this.email) { 
            this.msg = "Missing Email";
          }
        else {
          this.auth.resetPassword(this.email) 
          .then(
            () => this.msg = "Success", 
            () => this.msg = "Wrong Email"); 
        }
    }
}