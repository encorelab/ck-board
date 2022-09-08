import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { AuthGuard } from './auth.guard';
import { ProjectService } from '../services/project.service';
import { BoardService } from '../services/board.service';
import { UserService } from '../services/user.service';
import { Role, AuthUser } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class ProjectGuard implements CanActivate {
  board: any;
  project: any;

  constructor(
    public projectService: ProjectService,
    public boardService: BoardService,
    public userService: UserService,
    public router: Router,
    public authGuard: AuthGuard
  ) {}

  async canActivate(
    next: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot
  ): Promise<boolean> {
    const projectID = next.params.projectID;
    const boardID = next.params.boardID;

    const isValidProject = await this.isValidProject(projectID);
    if (!isValidProject) {
      this.router.navigate(['/error'], {
        state: { code: 404, message: 'This project does not exist!' },
      });
    }

    const isMember = this.isProjectMember();
    if (!isMember) {
      if (
        (await this.userService.isSsoEnabled()) &&
        this.userService.user != null
      ) {
        this.addProjectMember(this.project, this.userService.user);
      } else {
        this.router.navigate(['/error'], {
          state: {
            code: 403,
            message: 'You do not have access to this project!',
          },
        });
      }
    }
    if (boardID) {
      const isValidBoard = await this.isValidBoard(boardID);
      if (!isValidBoard) {
        this.router.navigate(['/error'], {
          state: { code: 404, message: 'This board does not exist!' },
        });
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
    }

    return true;
  }

  async isValidProject(projectID: string) {
    this.project = await this.projectService.get(projectID);
    return this.project !== null;
  }

  async isValidBoard(boardID: string) {
    this.board = await this.boardService.get(boardID);
    return this.board !== null;
  }

  isVisibleBoard() {
    const user = this.userService.user;
    return user?.role === Role.TEACHER || this.board.visible;
  }

  isProjectMember(): boolean {
    const user = this.userService.user;

    if (user && this.project.members.includes(user.userID)) {
      return true;
    }

    return false;
  }

  addProjectMember(project: any, user: AuthUser) {
    const members: string[] = project.members;
    members.push(user!.userID);
    this.projectService.update(project.projectID, { members: members });
  }
}
