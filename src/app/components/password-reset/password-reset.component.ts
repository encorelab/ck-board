import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';

@Component({ 
    templateUrl: 'password-reset.component.html', 
    styleUrls: ['./password-reset.component.scss']
})
export class PasswordResetComponent implements OnInit, OnDestroy{

    email: string
    emailMsg: string
    passwordMsg: string

    ngUnsubscribe: Subject<any> = new Subject<any>();

    mode: string;
    oobCode: string;

    newPassword: string;
    confirmPassword: string;

    oobCodeChecked: boolean;

    emailSubmitted: boolean;
    passwordSubmitted: boolean;

    constructor(private auth: AuthService, private activatedRoute: ActivatedRoute, private router: Router) {}

    ngOnInit() {
        this.activatedRoute.queryParams
          .pipe(takeUntil(this.ngUnsubscribe))
          .subscribe(params => {
            if (!params) {
                this.router.navigate(['/login']);
            }

            this.mode = params['mode'];
            this.oobCode = params['oobCode'];

            if(this.mode == "resetPassword") {
                this.auth.getAuth().verifyPasswordResetCode(this.oobCode)
                .then(() => {
                    this.oobCodeChecked = true;
                })
                .catch(e => {
                    alert(e);
                    this.router.navigate(['/password/reset']);
                });
            }
        })
    }
    
    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    onHandleEmail() {
        if(this.emailSubmitted) {
            console.log("SUBMITTED");
            if (!this.email) { 
                this.emailMsg = "Missing Email";
            }
            else {
            this.auth.resetPassword(this.email) 
            .then(
                () => this.emailMsg = "Success", 
                () => this.emailMsg = "Wrong Email"); 
            }
        }
        else {
            console.log("CANCELLED");
            this.router.navigate(['/login']);
        }
    }

    onSubmitEmail() {
        this.emailSubmitted = true;
    }
    onCancelEmail() {
        this.emailSubmitted = false;
    }


    onHandleResetPassword() {
        if(this.newPassword != this.confirmPassword) {
            this.passwordMsg = "Mismatch";
            return;
        } 

        this.auth.getAuth().confirmPasswordReset(this.oobCode, this.newPassword)
        .then(res => {
            this.passwordMsg = "Success";
            alert("Your password has been successfully updated");
            this.router.navigate(['/reset-password']);
        })
        .catch(() => this.passwordMsg = "Error");
    }

    onSubmitPassword() {
        this.passwordSubmitted = true;
    }
    onCancelPassword() {
        this.passwordSubmitted = false;
    }
}