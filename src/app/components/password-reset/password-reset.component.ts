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
        throw new Error('Method not implemented.');
    }

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

    onHandleResetPassword(): void {
        throw new Error('Method not implemented.');
    }
}