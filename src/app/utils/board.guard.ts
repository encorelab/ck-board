import { Injectable, NgZone } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { BoardService } from '../services/board.service';
import { Observable } from 'rxjs';
import { AuthGuard } from './auth.guard';

@Injectable({
  providedIn: 'root'
})
export class BoardGuard implements CanActivate {
  
  constructor(
    public boardService: BoardService,
    public router: Router,
    public ngZone: NgZone,
    public authGuard: AuthGuard
  ){ }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    const boardID = next.params.boardID

    return this.authGuard
        .canActivate(next, state)
        .then((isLoggedIn) => {
          if (isLoggedIn) {
            return this.isValidBoard(boardID)
          }
          return false
        })
  }

  isValidBoard(boardID) {
    const boardExists = new Promise<boolean>((resolve, _reject) => {
      this.boardService.get(boardID).then((board) => {
          if (board) {
              resolve(true)
          } else {
            this.ngZone.run(() => {
              this.router.navigate(['/login'])
              return false
            });
          }
      }).catch((e) => {
        this.router.navigate(['/login'])
        return false
      })
    })

    return boardExists;
  }

}