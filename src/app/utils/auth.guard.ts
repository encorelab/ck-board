import { Injectable, NgZone } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class AuthGuard implements CanActivate {
  
  constructor(
    public authService: AuthService,
    public router: Router,
    public ngZone: NgZone
  ){ }

  canActivate(
    _next: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot): Promise<boolean> {
    
    const isLoggedIn = new Promise<boolean>((resolve, reject) => {
      this.authService.getAuthenticatedUser().then((user) => {
        resolve(user != null)
      })
    })

    return isLoggedIn
  }

}