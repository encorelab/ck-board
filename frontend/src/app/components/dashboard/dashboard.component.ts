import { Component, OnInit } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
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
import { ProjectConfigurationModalComponent } from '../project-configuration-modal/project-configuration-modal.component';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { AddScoreRunModalComponent } from '../add-score-run-modal/add-score-run-modal.component';

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

  async getUsersProjects(id: string) {
    const projects = await this.projectService.getByUserID(id);
    this.yourProjects = projects;
  }

  handleProjectClick(projectID: string) {
    this.router.navigate(['project/' + projectID]);
  }

  async handleDeleteProject(project: Project) {
    this.dialog.open(ConfirmModalComponent, {
      width: '500px',
      data: {
        title: 'Confirmation',
        message:
          'This will permanently delete this project and all related content. Are you sure you want to do this?',
        handleConfirm: async () => {
          const deletedProject = await this.projectService.remove(
            project.projectID
          );
          if (deletedProject) {
            await this.getUsersProjects(this.user.userID);
          }
        },
      },
    });
  }

  openCreateBoardDialog() {
    this.dialog.open(AddBoardModalComponent, {
      width: '900px',
      data: {
        user: this.user,
        createBoard: this.createBoard,
        projects: this.yourProjects,
      },
    });
  }

  openCreateProjectDialog() {
    this.dialog.open(AddProjectModalComponent, {
      width: '900px',
      data: {
        user: this.user,
        createProject: this.createProject,
      },
    });
  }

  openCreateScoreRunDialog() {
    this.dialog.open(AddScoreRunModalComponent, {
      width: '900px',
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

  openProjectConfigDialog(project: Project) {
    this.dialog
      .open(ProjectConfigurationModalComponent, {
        maxWidth: 1280,
        width: '700px',
        data: { project: project, user: this.user },
      })
      .afterClosed()
      .subscribe((p: Project) => {
        this.yourProjects = this.yourProjects.filter(
          (yp) => yp.projectID !== p.projectID
        );
        this.yourProjects.push(p);
      });
  }

  createBoard = (board: Board, selectedProjectID: string) => {
    this.boardService.create(board).then((_) => {
      const view = board.defaultView ? board.defaultView.toLowerCase() : '';
      this.router.navigate([
        `project/${board.projectID}/board/${board.boardID}/${view}`,
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
