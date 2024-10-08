import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Board, BoardScope } from '../models/board';
import { Role } from '../models/user';
import { BoardService } from '../services/board.service';
import { UserService } from '../services/user.service';
import { getErrorMessage, getErrorStatus } from '../utils/Utils';
import { AuthGuard } from './auth.guard';

@Injectable({
  providedIn: 'root',
})
export class BoardGuard implements CanActivate {
  board: Board;
  expectedParamLen: number = 5;

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
    if (!this.userService.loggedIn) {
      return false;
    }

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

  async isValidBoard(boardID: string): Promise<boolean> {
    try {
      const board = await this.boardService.get(boardID);

      if (!board) {
        this.router.navigate(['/error'], {
          state: { code: 404, message: 'This board does not exist!' },
        });
        return false;
      }

      this.board = board; // Now board is guaranteed to be of type Board
    } catch (e) {
      const message = getErrorMessage(e);
      const status = getErrorStatus(e);
      this.router.navigate(['/error'], {
        state: { code: status, message: message },
      });
      return false;
    }

    return true;
  }

  isVisibleBoard() {
    const user = this.userService.user;
    return user?.role === Role.TEACHER || this.board.visible;
  }
}
