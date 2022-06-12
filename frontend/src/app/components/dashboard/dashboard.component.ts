import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Board } from 'src/app/models/board';
import User, { AuthUser, Role } from 'src/app/models/user';
import { BoardService } from 'src/app/services/board.service';
import { UserService } from 'src/app/services/user.service';
import { AddBoardModalComponent } from '../add-board-modal/add-board-modal.component';
import { ProjectService } from 'src/app/services/project.service';
import { Project } from 'src/app/models/project';
import { AddProjectModalComponent } from '../add-project-modal/add-project-modal.component';
import { JoinProjectModalComponent } from '../join-project-modal/join-project-modal.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  isLoading = true;

  user: AuthUser;

  yourProjects: Project[] = [];

  Role: typeof Role = Role;

  constructor(
    public userService: UserService,
    public boardService: BoardService,
    public router: Router,
    public dialog: MatDialog,
    public projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.user = this.userService.user!;
    this.getUsersProjects(this.user.userID).then(
      () => (this.isLoading = false)
    );
  }

  getUsersProjects(id) {
    return this.projectService.getByUserID(id).then((projects) => {
      this.yourProjects = this.yourProjects.concat(projects);
    });
  }

  handleProjectClick(projectID) {
    this.router.navigate(['project/' + projectID]);
  }

  openCreateBoardDialog() {
    this.dialog.open(AddBoardModalComponent, {
      width: '700px',
      data: {
        user: this.user,
        createBoard: this.createBoard,
        projects: this.yourProjects,
      },
    });
  }

  openCreateProjectDialog() {
    this.dialog.open(AddProjectModalComponent, {
      width: '700px',
      data: {
        user: this.user,
        createProject: this.createProject,
      },
    });
  }

  openJoinProjectDialog() {
    this.dialog.open(JoinProjectModalComponent, {
      width: '700px',
      data: {
        user: this.user,
      },
    });
  }

  createBoard = (board: Board, selectedProjectID: string) => {
    this.boardService.create(board).then((_) => {
      this.router.navigate([
        'project/' + selectedProjectID + '/board/' + board.boardID,
      ]);
    });
    const projectBoards = this.yourProjects.find(
      (project) => project.projectID == selectedProjectID
    )?.boards;
    if (projectBoards) {
      this.projectService.update(selectedProjectID, {
        boards: [...projectBoards, board.boardID],
      });
    }
  };

  createProject = (project: Project) => {
    this.projectService.create(project).then((_) => {
      this.router.navigate(['project/' + project.projectID]);
    });
  };
}
