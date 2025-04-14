import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  RouterStateSnapshot,
} from '@angular/router';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root',
})
export class SsoGuard implements CanActivate {
  constructor(public userService: UserService) {}

  async canActivate(
    _next: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ) {
    if (this.userService.loggedIn) {
      if (window.opener != null) {
        window.opener.postMessage('loadAttemptedUrl', '*');
      }
      return true;
    } else {
      if (await this.userService.isSsoEnabled()) {
        return this.userService.trySsoLogin(_state.url);
      } else {
        return true;
      }
    }
  }
}
