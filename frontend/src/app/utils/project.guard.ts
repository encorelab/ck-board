import { Injectable, NgZone } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { BoardService } from '../services/board.service';
import { Observable } from 'rxjs';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { ProjectService } from '../services/project.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectGuard implements CanActivate {
  
  board: any
  project:any

  constructor(
    public projectService: ProjectService,
    public authService: AuthService,
    public router: Router,
    public ngZone: NgZone,
    public authGuard: AuthGuard
  ){ }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    const projectID = next.params.projectID
    return this.authGuard
        .canActivate(next, state)
        .then((isLoggedIn) => {
          if (isLoggedIn) {
            return this.isValidProject(projectID) 
          }
          return false
        })
        .then(isValid => {
          if (isValid && this.project.public) {
            return true
          } else if (isValid) {
            return this.isProjectMember()
          }
          return false
        })
  }

  isValidProject(projectID) {
    const projectExists = new Promise<boolean>((resolve, _reject) => {
      this.projectService.get(projectID).then((project) => {
          if (project) {
              this.project = project
              resolve(true)
              
              return true
          } else {
            this.ngZone.run(() => {
              this.router.navigate(['/error'], { state: { code: 404, message: 'This project does not exist!' }})
            });
          }
          return false
      }).catch((e) => {
        this.router.navigate(['/error'], { state: { code: 404, message: 'This project does not exist!' }})
        return false
      })
    })

    return projectExists;
  }

  isProjectMember(): Promise<boolean> {
    const isProjectMember = new Promise<boolean>((resolve, _reject) => {
      this.authService.getAuthenticatedUser().then(user => {
        if (user && this.project.members.includes(user.id)) {
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

    return isProjectMember;
  }
}