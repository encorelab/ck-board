import { Injectable, NgZone } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

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
        if (user) {
          resolve(true)
          return true
        } 
        this.ngZone.run(() => {
          this.router.navigate(['/error'], { state: { code: 403, message: 'Forbidden! Please sign in' }})
        })
        return false
      }).catch(e => {
        this.ngZone.run(() => {
          this.router.navigate(['/error'], { state: { code: 403, message: 'Forbidden! Please sign in' }})
          return false
        })
      })
    })

    return isLoggedIn
  }

}