import { Component, OnInit } from '@angular/core';
import { Board, BoardScope, ViewType } from 'src/app/models/board';
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
import { TodoListModalComponent } from '../todo-list-modal/todo-list-modal.component';
import { UserService } from 'src/app/services/user.service';
import { ManageGroupModalComponent } from '../groups/manage-group-modal/manage-group-modal.component';
import { ProjectTodoListModalComponent } from '../project-todo-list-modal/project-todo-list-modal.component';
import { SocketService } from 'src/app/services/socket.service';

@Component({
  selector: 'app-project-dashboard',
  templateUrl: './project-dashboard.component.html',
  styleUrls: ['./project-dashboard.component.scss'],
})
export class ProjectDashboardComponent implements OnInit {
  showSharedBoards = true;
  showStudentPersonalBoards = false;
  showTeacherPersonalBoards = false;

  teacherPersonalBoards: Board[] = [];
  studentPersonalBoards: Board[] = [];
  sharedBoards: Board[] = [];

  project: Project;
  user: AuthUser;
  teachers: AuthUser[];
  projectID: string;
  yourProjects: Project[] = [];

  Role: typeof Role = Role;
  BoardScope: typeof BoardScope = BoardScope;

  constructor(
    public boardService: BoardService,
    public projectService: ProjectService,
    public userService: UserService,
    public socketService: SocketService,
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
    const boards = await this.boardService.getByProject(this.projectID);
    boards.forEach((board) => {
      if (board.scope == BoardScope.PROJECT_PERSONAL) {
        const isTeacher = this.project.teacherIDs.includes(board.ownerID);
        if (isTeacher) this.teacherPersonalBoards.push(board);
        else this.studentPersonalBoards.push(board);
      } else if (board.scope == BoardScope.PROJECT_SHARED) {
        this.sharedBoards.push(board);
      }
    });
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

      const view = board.defaultView ? board.defaultView.toLowerCase() : '';
      this.router.navigate([
        `project/${this.projectID}/board/${board.boardID}/${view}`,
      ]);
    }
  };

  openSettingsDialog() {
    this.dialog
      .open(ProjectConfigurationModalComponent, {
        data: { project: this.project, user: this.user },
      })
      .afterClosed()
      .subscribe((p?: Project) => {
        if (p) this.project = p;
      });
  }

  openTodoList() {
    this.router.navigate([`/project/${this.projectID}/todo`]);
  }

  openProjectTodoList() {
    this.router.navigate([`/project/${this.projectID}/todo`]);
  }

  toggleBoardVisibility(event: any, board: Board) {
    event.stopPropagation();
    if (board.visible) this.socketService.disconnectAll(board.boardID);
    this.boardService.update(board.boardID, { visible: !board.visible });
    board.visible = !board.visible;
  }

  openGroupDialog() {
    this.dialog.open(ManageGroupModalComponent, {
      data: {
        project: this.project,
      },
    });
  }

  handleBoardClick(boardID, defaultView: ViewType | undefined | null) {
    const view = defaultView ? defaultView.toLowerCase() : '';
    this.router.navigate([
      `project/${this.projectID}/board/${boardID}/${view}`,
    ]);
  }

  async handleEditBoard(board: Board) {
    const boardID: string = board.boardID;
    this.dialog.open(ConfigurationModalComponent, {
      width: '700px',
      data: {
        project: this.project,
        board: await this.boardService.get(boardID),
        update: async (updatedBoard: Board, removed = false) => {
          if (removed) {
            this.sharedBoards = this.sharedBoards.filter(
              (b) => b.boardID !== updatedBoard.boardID
            );
            this.studentPersonalBoards = this.studentPersonalBoards.filter(
              (b) => b.boardID !== updatedBoard.boardID
            );
            this.teacherPersonalBoards = this.teacherPersonalBoards.filter(
              (b) => b.boardID !== updatedBoard.boardID
            );
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
            this.sharedBoards = this.sharedBoards.filter(
              (b) => b.boardID !== deletedBoard.boardID
            );
            this.studentPersonalBoards = this.studentPersonalBoards.filter(
              (b) => b.boardID !== deletedBoard.boardID
            );
            this.teacherPersonalBoards = this.teacherPersonalBoards.filter(
              (b) => b.boardID !== deletedBoard.boardID
            );
          }
        },
      },
    });
  }

  signOut(): void {
    this.userService.logout();
    this.router.navigate(['login']);
  }
}
