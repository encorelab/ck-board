import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { AuthGuard } from './auth.guard';
import { BoardService } from '../services/board.service';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root',
})
export class BoardGuard implements CanActivate {
  board: any;

  constructor(
    public boardService: BoardService,
    public userService: UserService,
    public router: Router,
    public authGuard: AuthGuard
  ) {}

  async canActivate(
    next: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Promise<boolean> {
    const boardID = next.params.boardID;

    if (boardID) {
      const isValidBoard = await this.isValidBoard(boardID);
      console.log(isValidBoard);
      if (!isValidBoard) {
        this.router.navigate(['/error'], {
          state: { code: 404, message: 'This board does not exist!' },
        });
      }
    }

    return true;
  }

  async isValidBoard(boardID: string) {
    this.board = await this.boardService.get(boardID);
    return this.board !== null;
  }
}
