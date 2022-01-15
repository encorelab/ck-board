import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Board } from 'src/app/models/board';
import User from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';
import { BoardService } from 'src/app/services/board.service';
import { UserService } from 'src/app/services/user.service';
import { AddBoardModalComponent } from '../add-board-modal/add-board-modal.component';
import { JoinBoardModalComponent } from '../join-board-modal/join-board-modal.component';
import { ProjectService } from 'src/app/services/project.service';
import { Project } from 'src/app/models/project';
import { AddProjectModalComponent } from '../add-project-modal/add-project-modal.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  isLoading: boolean = true

  user: User

  yourBoards: Board[] = []
  publicBoards: Board[] = []

  yourProjects:Project[]=[]
  
  constructor(public userService: UserService, public authService: AuthService, 
    public boardService: BoardService, public router: Router, public dialog: MatDialog, public projectService:ProjectService) {}

  ngOnInit(): void {
    this.user = this.authService.userData
    this.authService.getAuthenticatedUser().then(user => {
      this.user = user
      this.getUsersBoards(this.user.id).then(_ => this.isLoading = false)
      this.getUsersProjects(this.user.id).then(_ => this.isLoading = false)

    })
  }

  getUsersBoards(id) {
    return this.boardService.getByUserID(id).then(boards => {
      boards.forEach((data) => {
        let board = data.data() ?? {}
        this.yourBoards.push(board)
      })
      this.getPublicBoards()
    })
  }
  
  getUsersProjects(id){
    return this.projectService.getByUserID(id).then(project => {
      project.forEach((data) => {
        let project = data.data() ?? {}
        this.yourProjects.push(project)
      })
    })
  }
  
  getPublicBoards() {
    this.boardService.getPublic().then(boards => {
      boards.forEach((data) => {
        let board = data.data() ?? {}
        if (!this.yourBoards.includes(board))
          this.publicBoards.push(board)
      })
    })
  }

  handleBoardClick(boardID) {
    this.router.navigate(['canvas/' + boardID]);
  }

  openCreateBoardDialog() {
    this.dialog.open(AddBoardModalComponent, {
      width: '700px',
      data: {
        user: this.user,
        createBoard: this.createBoard
      }
    });
  }

  openCreateProjectDialog() {
    this.dialog.open(AddProjectModalComponent, {
      width: '700px',
      data: {
        user: this.user,
        createProject: this.createProject
      }
    });
  }

  openJoinBoardDialog() {
    this.dialog.open(JoinBoardModalComponent, {
      width: '700px',
      data: {
        user: this.user
      }
    });
  }

  createBoard = (board: Board) => {
    this.boardService.create(board).then(_ => {
      this.router.navigate(['canvas/' + board.boardID])
    })
  }

  createProject = (project: Project) => {
    this.projectService.create(project).then(_ => {
      alert(project.name +"created!")
      //this.router.navigate(['canvas/' + project.boardID])
    })
  }
}
