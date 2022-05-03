import { Injectable, NgZone } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { BoardService } from '../services/board.service';
import { Observable } from 'rxjs';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { Board } from '../models/board';

@Injectable({
  providedIn: 'root'
})
export class BoardGuard implements CanActivate {
  
  board: any

  constructor(
    public boardService: BoardService,
    public authService: AuthService,
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
        .then(isValid => {
          if (isValid) {
            return this.isBoardMember()
          }
          return false
        })
  }

  isValidBoard(boardID) {
    const boardExists = new Promise<boolean>((resolve, _reject) => {
      this.boardService.get(boardID).then((board) => {
          if (board) {
              this.board = board
              resolve(true)
              return true
          } else {
            this.ngZone.run(() => {
              this.router.navigate(['/error'], { state: { code: 404, message: 'This board does not exist!' }})
            });
          }
          return false
      }).catch((e) => {
        this.router.navigate(['/error'], { state: { code: 404, message: 'This board does not exist!' }})
        return false
      })
    })

    return boardExists;
  }

  isBoardMember(): Promise<boolean> {
    const isBoardMember = new Promise<boolean>((resolve, _reject) => {
      this.authService.getAuthenticatedUser().then(user => {
        if (user && this.board.members.includes(user.id)) {
          resolve(true)
          return true
        } else {
          this.ngZone.run(() => {
            this.router.navigate(['/error'], { state: { code: 403, message: 'You do not have access to this board' }})
          });
        }
        return false
      }).catch(e => {
        this.router.navigate(['/error'], { state: { code: 403, message: 'You do not have access to this board' }})
        return false
      })
    })

    return isBoardMember;
  }
}