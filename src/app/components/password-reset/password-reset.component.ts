import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';

import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';
import { FormControl, Validators } from '@angular/forms';

import { MatDialog } from '@angular/material/dialog';
import { PasswordResetConfirmationModalComponent } from '../password-reset-confirmation-modal/password-reset-confirmation-modal.component';
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

    matcher = new MyErrorStateMatcher();
    passwordControl = new FormControl('', [Validators.required, Validators.minLength(12), Validators.maxLength(30)]);

    constructor(public dialog: MatDialog, private auth: AuthService, 
        private activatedRoute: ActivatedRoute, private router: Router) {}

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
                    this.router.navigate(['/reset-password']);
                });
            }
        })
    }
    
    ngOnDestroy(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    openDialog() {
        this.dialog.open(PasswordResetConfirmationModalComponent, {
            width: '300px',
            data: {}
        });
    }

    onHandleEmail() {
        if(this.emailSubmitted) {
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
        if(this.passwordSubmitted) {
            if(this.newPassword != this.confirmPassword) {
                this.passwordMsg = "Mismatch";
                return;
            } 
    
            this.auth.getAuth().confirmPasswordReset(this.oobCode, this.newPassword)
            .then(res => {
                this.passwordMsg = "Success";
                this.openDialog();
            })
            .catch(() => this.passwordMsg = "Error");
        }
        else {
            this.router.navigate(['/login']);
        }

    }

    onSubmitPassword() {
        this.passwordSubmitted = true;
    }
    onCancelPassword() {
        this.passwordSubmitted = false;
    }
}