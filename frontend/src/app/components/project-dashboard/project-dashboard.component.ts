import { Component, OnInit } from '@angular/core';
import { Board } from 'src/app/models/board';
import { Project } from 'src/app/models/project';

import User, { AuthUser, Role } from 'src/app/models/user';
import { BoardService } from 'src/app/services/board.service';
import { ProjectService } from 'src/app/services/project.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AddBoardModalComponent } from '../add-board-modal/add-board-modal.component';
import { ConfigurationModalComponent } from '../configuration-modal/configuration-modal.component';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { ProjectConfigurationModalComponent } from '../project-configuration-modal/project-configuration-modal.component';
import { UserService } from 'src/app/services/user.service';
import { ManageGroupModalComponent } from '../groups/manage-group-modal/manage-group-modal.component';

@Component({
  selector: 'app-project-dashboard',
  templateUrl: './project-dashboard.component.html',
  styleUrls: ['./project-dashboard.component.scss'],
})
export class ProjectDashboardComponent implements OnInit {
  boards: Board[] = [];
  project: Project;
  user: AuthUser;
  projectID: string;
  yourProjects: Project[] = [];

  Role: typeof Role = Role;

  constructor(
    public boardService: BoardService,
    public projectService: ProjectService,
    public userService: UserService,
    public dialog: MatDialog,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.user = this.userService.user!;
    this.projectID = this.router.url.substring(
      this.router.url.lastIndexOf('/') + 1
    );
    await this.getBoards();
    await this.getUsersProjects(this.user.userID);
  }

  async getBoards() {
    this.project = await this.projectService.get(this.projectID);
    await this.getUsersProjects(this.user.userID);
    const tempBoards: Board[] = [];
    for (const boardID of this.project.boards) {
      const board = await this.boardService.get(boardID);
      tempBoards.push(board);
    }
    this.boards = tempBoards;
  }

  async getUsersProjects(id) {
    const projects = await this.projectService.getByUserID(id);
    this.yourProjects = projects;
  }

  openCreateBoardDialog() {
    this.dialog.open(AddBoardModalComponent, {
      width: '700px',
      data: {
        user: this.user,
        createBoard: this.createBoard,
        projects: this.yourProjects,
        defaultProject: this.projectID,
      },
    });
  }

  createBoard = async (board: Board, selectedProjectID: string) => {
    const projectBoards = this.yourProjects.find(
      (project) => project.projectID == selectedProjectID
    )?.boards;

    if (projectBoards) {
      await this.boardService.create(board);
      await this.projectService.update(selectedProjectID, {
        boards: [...projectBoards, board.boardID],
      });

      this.router.navigate([
        'project/' + selectedProjectID + '/board/' + board.boardID,
      ]);
    }
  };

  updateProjectName = (projectID: string, name: string) => {
    this.project.name = name;
    this.projectService.update(projectID, { name: name });
  };

  openSettingsDialog() {
    this.dialog.open(ProjectConfigurationModalComponent, {
      data: {
        project: this.project,
        updateProjectName: this.updateProjectName,
      },
    });
  }

  openGroupDialog() {
    this.dialog.open(ManageGroupModalComponent, {
      data: {
        project: this.project,
      },
    });
  }

  handleBoardClick(boardID) {
    this.router.navigate(['project/' + this.projectID + '/board/' + boardID]);
  }

  async handleEditBoard(board: Board) {
    const boardID: string = board.boardID;
    this.dialog.open(ConfigurationModalComponent, {
      width: '700px',
      data: {
        projectID: this.projectID,
        board: await this.boardService.get(boardID),
        update: async (updatedBoard: Board, removed = false) => {
          if (removed || updatedBoard.name !== board.name) {
            await this.getBoards();
          }
          if (updatedBoard.name !== board.name) {
            board.name = updatedBoard.name;
          }
        },
      },
    });
  }

  async handleDeleteBoard(board: Board) {
    this.dialog.open(ConfirmModalComponent, {
      width: '500px',
      data: {
        title: 'Confirmation',
        message:
          'This will permanently delete the board and all related content. Are you sure you want to do this?',
        handleConfirm: async () => {
          const deletedBoard = await this.boardService.remove(board.boardID);
          if (deletedBoard) {
            await this.getBoards();
          }
        },
      },
    });
  }
}
