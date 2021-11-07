import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { BoardService } from '../services/board.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class BoardGuard implements CanActivate {
  
  constructor(
    public boardService: BoardService,
    public router: Router
  ){ }

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    const boardID = route.params.boardID

    const boardExists = new Promise<boolean>((resolve, reject) => {
        this.boardService.get(boardID).then((board) => {
            if (board) {
                resolve(true)
            } else {
                this.router.navigate(['/login']);
            }
        }).catch(() => reject(false))
    })

    return boardExists;
  }
}