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
    msg: string

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
                this.msg = "Missing Email";
            }
            else {
            this.auth.resetPassword(this.email) 
            .then(
                () => this.msg = "Success", 
                () => this.msg = "Wrong Email"); 
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
        throw new Error('onHandleResetPassword method not implemented.');
    }

    onSubmitPassword() {
        throw new Error('onSubmitPassword method not implemented.');
    }
    onCancelPassword() {
        throw new Error('onCancelPassword method not implemented.');
    }
}