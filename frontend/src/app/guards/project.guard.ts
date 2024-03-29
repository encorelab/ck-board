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
import { Project } from '../models/project';
import { getErrorMessage, getErrorStatus } from '../utils/Utils';

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
    if (!this.userService.loggedIn) {
      return false;
    }

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
      if (
        (await this.userService.isSsoEnabled()) &&
        this.userService.user != null
      ) {
        await this.addProjectMember(this.project, this.userService.user);
      } else {
        this.router.navigate(['/error'], {
          state: {
            code: 403,
            message: 'You do not have access to this project!',
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

  isProjectMember(): boolean {
    const user = this.userService.user;

    if (user && this.project.members.includes(user.userID)) {
      return true;
    }

    return false;
  }

  async addProjectMember(project: any, user: AuthUser): Promise<void> {
    const code =
      user.role == Role.STUDENT
        ? project.studentJoinCode
        : project.teacherJoinCode;

    try {
      await this.projectService.joinProject(code);
    } catch (e) {
      this.router.navigate(['/error'], {
        state: {
          code: getErrorStatus(e),
          message: getErrorMessage(e),
        },
      });
    }
  }
}
