import { Component, OnInit } from '@angular/core';
import { Board } from 'src/app/models/board';
import { Project } from 'src/app/models/project';
import User from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';
import { BoardService } from 'src/app/services/board.service';
import { ProjectService } from 'src/app/services/project.service';
import {Router} from '@angular/router'

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


  constructor(public boardService:BoardService,
    public projectService:ProjectService,
    public authService:AuthService,
    private router:Router) { }

  async ngOnInit(): Promise<void> {
    this.user = this.authService.userData;
    this.projectID = this.router.url.substring(this.router.url.lastIndexOf('/')+1)
    await this.getBoards()

  }


  async getBoards(){
    this.project = await this.projectService.get(this.projectID)
    for( let boardID of this.project.boards){
      let board = await this.boardService.get(boardID)
      this.boards.push(board)
    }
  }

  handleBoardClick(boardID) {
    this.router.navigate(['canvas/' + this.projectID + '/'+ boardID]);
  }

}
