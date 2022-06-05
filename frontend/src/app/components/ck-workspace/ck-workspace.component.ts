import { ComponentType } from '@angular/cdk/overlay';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Board } from 'src/app/models/board';
import { Project } from 'src/app/models/project';
import User, { AuthUser, Role } from 'src/app/models/user';
import {
  ContainerType,
  TaskAction,
  TaskWorkflow,
} from 'src/app/models/workflow';
import { BoardService } from 'src/app/services/board.service';
import { ProjectService } from 'src/app/services/project.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { UserService } from 'src/app/services/user.service';
import { WorkflowService } from 'src/app/services/workflow.service';
import { BucketsModalComponent } from '../buckets-modal/buckets-modal.component';
import { ListModalComponent } from '../list-modal/list-modal.component';

const MOCK_ACTIVE_TASKS = [
  {
    workflowID: '1',
    boardID: '1',
    name: 'Creative Task 1',
    prompt: 'Tag each post with atleast one tag .......',
    actions: [TaskAction.TAG],
    assignedGroups: ['1', '2'],
    active: true,
    source: { id: '1', type: ContainerType.BOARD, name: 'Board 1' },
    destinations: [],
  },
  {
    workflowID: '2',
    boardID: '1',
    name: 'Creative Task 2',
    prompt: 'Tag each post with atleast one tag .......',
    actions: [TaskAction.TAG],
    assignedGroups: ['1', '2'],
    active: true,
    source: { id: '1', type: ContainerType.BOARD, name: 'Board 1' },
    destinations: [],
  },
  {
    workflowID: '3',
    boardID: '1',
    name: 'Creative Task 3',
    prompt: 'Tag each post with atleast one tag .......',
    actions: [TaskAction.TAG],
    assignedGroups: ['1', '2'],
    active: true,
    source: { id: '1', type: ContainerType.BOARD, name: 'Board 1' },
    destinations: [],
  },
];

const MOCK_INACTIVE_TASKS = [
  {
    workflowID: '1',
    boardID: '1',
    name: 'Creative Task 312',
    prompt: 'Tag each post with atleast one tag .......',
    actions: [TaskAction.TAG],
    assignedGroups: ['1', '2'],
    active: true,
    source: { id: '1', type: ContainerType.BOARD, name: 'Board 1' },
    destinations: [],
  },
  {
    workflowID: '2',
    boardID: '1',
    name: 'Creative Task 843',
    prompt: 'Tag each post with atleast one tag .......',
    actions: [TaskAction.TAG],
    assignedGroups: ['1', '2'],
    active: true,
    source: { id: '1', type: ContainerType.BOARD, name: 'Board 1' },
    destinations: [],
  },
];

@Component({
  selector: 'app-ck-workspace',
  templateUrl: './ck-workspace.component.html',
  styleUrls: ['./ck-workspace.component.scss'],
})
export class CkWorkspaceComponent implements OnInit {
  user: AuthUser;

  project: Project;
  board: Board;

  activeTasks: TaskWorkflow[] = [];
  inactiveTasks: TaskWorkflow[] = [];

  Role: typeof Role = Role;

  taskMode: boolean = false;

  constructor(
    public userService: UserService,
    public projectService: ProjectService,
    public boardService: BoardService,
    public workflowService: WorkflowService,
    public snackbarService: SnackbarService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.user = this.userService.user!;
    this.loadWorkspaceData();
  }

  async loadWorkspaceData(): Promise<boolean> {
    const map = this.activatedRoute.snapshot.paramMap;
    let boardID: string, projectID: string;

    if (map.has('boardID') && map.has('projectID')) {
      boardID = this.activatedRoute.snapshot.paramMap.get('boardID') ?? '';
      projectID = this.activatedRoute.snapshot.paramMap.get('projectID') ?? '';
    } else {
      return this.router.navigate(['error']);
    }

    this.board = await this.boardService.get(boardID);
    this.project = await this.projectService.get(projectID);
    // this.tasks = await this.workflowService.getTask(boardID);

    this.activeTasks = MOCK_ACTIVE_TASKS;
    this.inactiveTasks = MOCK_INACTIVE_TASKS;

    return true;
  }

  showBucketsModal() {
    this._openDialog(BucketsModalComponent, {
      board: this.board,
      user: this.user,
      allowMovePostToBoard: false,
    });
  }

  showListModal() {
    this._openDialog(ListModalComponent, {
      board: this.board,
    });
  }

  private _openDialog(component: ComponentType<unknown>, data: any) {
    this.dialog.open(component, {
      maxWidth: 1280,
      width: '95vw',
      autoFocus: false,
      data: data,
    });
  }
}
