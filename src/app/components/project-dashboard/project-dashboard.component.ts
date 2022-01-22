import { Component, OnInit } from '@angular/core';
import { Board } from 'src/app/models/board';
import { Project } from 'src/app/models/project';
import User from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';
import { BoardService } from 'src/app/services/board.service';
import { ProjectService } from 'src/app/services/project.service';
import {Router} from '@angular/router'
import { MatDialog } from '@angular/material/dialog';
import { AddBoardModalComponent } from '../add-board-modal/add-board-modal.component';


@Component({
  selector: 'app-project-dashboard',
  templateUrl: './project-dashboard.component.html',
  styleUrls: ['./project-dashboard.component.scss']
})
export class ProjectDashboardComponent implements OnInit {

  boards:Board[] =[]
  project:Project
  user:User
  projectID:string
  yourProjects:Project[]=[]


  constructor(public boardService:BoardService,
    public projectService:ProjectService,
    public authService:AuthService,
    public dialog: MatDialog,
    private router:Router) { }

  async ngOnInit(): Promise<void> {
    this.user = this.authService.userData;
    this.projectID = this.router.url.substring(this.router.url.lastIndexOf('/')+1)
    await this.getBoards()
    this.user = await this.authService.getAuthenticatedUser()
    await this.getUsersProjects(this.user.id)

  }


  async getBoards(){
    this.project = await this.projectService.get(this.projectID)
    for( let boardID of this.project.boards){
      let board = await this.boardService.get(boardID)
      this.boards.push(board)
    }
  }

  async getUsersProjects(id){
    let project = await this.projectService.getByUserID(id)
    project.forEach((data) => {
      let project = data.data() ?? {}
      this.yourProjects.push(project)
    })
  }

  openCreateBoardDialog() {
    this.dialog.open(AddBoardModalComponent, {
      width: '700px',
      data: {
        user: this.user,
        createBoard: this.createBoard,
        projects:this.yourProjects,
        defaultProject: this.projectID
      }
    });
  }

  createBoard = (board: Board, selectedProjectID:string) => {
    this.boardService.create(board).then(_ => {
      this.router.navigate(['canvas/' + board.boardID])
    })
    let projectBoards = this.yourProjects.find(project=>project.projectID == selectedProjectID)?.boards
    if(projectBoards){
      this.projectService.update(selectedProjectID,{boards:[...projectBoards,board.boardID]})
    }
  }


  handleBoardClick(boardID) {
    this.router.navigate(['canvas/' + this.projectID + '/'+ boardID]);
  }

}
