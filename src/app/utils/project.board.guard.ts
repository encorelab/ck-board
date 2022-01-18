import { Injectable, NgZone } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { BoardService } from '../services/board.service';
import { Observable } from 'rxjs';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { Board } from '../models/board';
import { ProjectService } from '../services/project.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectBoardGuard implements CanActivate {
  
  board: any
  project:any

  constructor(
    public boardService: BoardService,
    public projectService: ProjectService,
    public authService: AuthService,
    public router: Router,
    public ngZone: NgZone,
    public authGuard: AuthGuard
  ){ }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    alert(JSON.stringify(next.params))
    const boardID = next.params.boardID
    const projectID = next.params.projectID
    

    return this.authGuard
        .canActivate(next, state)
        .then((isLoggedIn) => {
          if (isLoggedIn) {
            return this.isValidProject(projectID) 
          }
          return false
        })
        .then(isValid=>{
          if(isValid){
            return this.isValidBoard(boardID) 
          }
          return false
        })
        .then(isValid => {
          if (isValid && this.board.public) {
            return true
          } else if (isValid) {
            return this.isBoardMember()
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
        if (user && this.project.members.includes(user.id)) {
          resolve(true)
          alert("ran")
          return true
        } else {
          console.log('here')
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