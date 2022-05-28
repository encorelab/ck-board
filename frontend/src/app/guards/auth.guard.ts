import { Injectable, NgZone } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    public router: Router,
    public userService: UserService,
    public ngZone: NgZone
  ) {}

  canActivate(_next: ActivatedRouteSnapshot, _state: RouterStateSnapshot) {
    if (this.userService.loggedIn) {
      return true;
    }

    this.router.navigate(['/error'], {
      state: { code: 403, message: 'Forbidden! Please sign in' },
    });
    return false;
  }
}
