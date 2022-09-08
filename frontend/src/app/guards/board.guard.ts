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
import { Board, BoardScope } from '../models/board';
import { Role } from '../models/user';
import { getErrorMessage, getErrorStatus } from '../utils/Utils';

@Injectable({
  providedIn: 'root',
})
export class BoardGuard implements CanActivate {
  board: Board;

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
      if (!isValidBoard) {
        this.router.navigate(['/error'], {
          state: { code: 404, message: 'This board does not exist!' },
        });
        return false;
      }
    }

    const isVisibleBoard = this.isVisibleBoard();
    if (!isVisibleBoard) {
      this.router.navigate(['/error'], {
        state: {
          code: 403,
          message: 'You do not have access to this board!',
        },
      });
    }

    if (this.board.scope == BoardScope.PROJECT_PERSONAL) {
      const user = this.userService.user;
      if (user?.role == Role.TEACHER || this.board.ownerID == user?.userID) {
        return true;
      } else {
        this.router.navigate(['/error'], {
          state: { code: 403, message: 'Access to board is forbidden!' },
        });
        return false;
      }
    } else if (this.board.scope == BoardScope.PROJECT_SHARED) {
      return true;
    }

    return true;
  }

  async isValidBoard(boardID: string) {
    try {
      this.board = await this.boardService.get(boardID);
    } catch (e) {
      const message = getErrorMessage(e);
      const status = getErrorStatus(e);
      this.router.navigate(['/error'], {
        state: { code: status, message: message },
      });
      return false;
    }

    return this.board != undefined;
  }

  isVisibleBoard() {
    const user = this.userService.user;
    return user?.role === Role.TEACHER || this.board.visible;
  }
}
