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
import { ProjectConfigurationModalComponent } from '../project-configuration-modal/project-configuration-modal.component';
import { Role } from 'src/app/utils/constants';
import Trace from 'src/app/interfaces/trace';
import { ExportToCsv } from 'export-to-csv';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { E } from '@angular/cdk/keycodes';

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

  Role: typeof Role = Role

  private tracePath : string = 'trace';
  traceCollection: AngularFirestoreCollection<Trace>;

  constructor(public boardService:BoardService,
    public projectService:ProjectService,
    public authService:AuthService,
    public dialog: MatDialog, 
    private db: AngularFirestore,
    private router:Router) 
    { 
      this.traceCollection = db.collection<Trace>(this.tracePath);
    }

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
    let projectBoards = this.yourProjects.find(project=>project.projectID == selectedProjectID)?.boards
    if(projectBoards){
      this.projectService.update(selectedProjectID,{boards:[...projectBoards,board.boardID]})
      .then(_=>{
        return this.boardService.create(board)
      })
      .then(_ => {
        this.router.navigate(['project/' +selectedProjectID+"/board/"+ board.boardID])
      })
    }
    
    
  }

  updateProjectName = (name) =>{
    this.project.name = name
    this.projectService.update(this.projectID,{name:name})

  }

  openSettingsDialog(){
    this.dialog.open(ProjectConfigurationModalComponent, {
      data:{
        project:this.project,
        updateProjectName:this.updateProjectName
      }
    })
  }


  handleBoardClick(boardID) {
    this.router.navigate(['project/' + this.projectID + '/board/'+ boardID]);
  }

  async exportToCSV() {
    const options = { 
      filename: "CKBoard Tracing",
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true, 
      showTitle: true,
      title: 'CKBoard Tracing',
      useTextFile: false,
      useBom: true,
      useKeysAsHeaders: true,
    };
    const csvExporter = new ExportToCsv(options);
    
    const trace = await this.traceCollection.ref.where("projectId", "==", this.projectID).get();
    let traceData: Trace[] = [];
    trace.forEach(data => traceData.push(data.data()));
    console.log(traceData);
    if(traceData.length == 0) {
      traceData.push({
        traceId: "",
        projectId : "",
        projectName: "",
        boardId: "",
        boardName: "",
        agentUserId: "",
        agentUserName: "",
        commentId: "",
        commentText: "",
        postId: "",
        postTitle: "",
        postMessage: "", 
        postTitleOrMessageModifiedCounter: 0,
        clientTimestamp: -1,
        serverTimestamp: -1,
        commentModifiedTextCounter: 0,
        postModifiedUpvote: 0,
        postTagNameAdded: [],
        postTagNameRemoved: "",
        postModifiedLocationX: null,
        postModifiedLocationY: null,
        postDeleted: 0,
        bucketId: "",
        bucketName: "",
        postRead: 0 
      })
      csvExporter.generateCsv(traceData);
    }
    else {
      console.log(traceData);
      csvExporter.generateCsv(traceData);
    }
  }

}
