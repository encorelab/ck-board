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

    const isValidProject = await this.isValidProject(projectID);
    if (!isValidProject) {
      this.router.navigate(['/error'], {
        state: { code: 404, message: 'This project does not exist!' },
      });
      return false;
    }

    const isMember = this.isProjectMember();
    if (!isMember) {
      this.router.navigate(['/error'], {
        state: {
          code: 403,
          message: 'You do not have access to this project!',
        },
      });
      return false;
    }

    return true;
  }

  async isValidProject(projectID: string) {
    this.project = await this.projectService.get(projectID);
    return this.project !== null;
  }

  isProjectMember(): boolean {
    const user = this.userService.user;

    if (user && this.project.members.includes(user.userID)) {
      return true;
    }

    return false;
  }
}
