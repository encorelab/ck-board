import { ComponentType } from '@angular/cdk/overlay';
import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Board } from 'src/app/models/board';
import { Project } from 'src/app/models/project';
import { AuthUser, Role } from 'src/app/models/user';
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
import { EventsParams, SwiperComponent } from 'swiper/angular';
import SwiperCore, { EffectCards } from 'swiper';
import Post, { PostType } from 'src/app/models/post';
import { HTMLPost } from '../html-post/html-post.component';

// install Swiper modules
SwiperCore.use([EffectCards]);

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
  encapsulation: ViewEncapsulation.None,
})
export class CkWorkspaceComponent implements OnInit {
  @ViewChild(SwiperComponent) swiper: SwiperComponent;

  user: AuthUser;

  project: Project;
  board: Board;

  activeTasks: TaskWorkflow[] = [];
  inactiveTasks: TaskWorkflow[] = [];

  Role: typeof Role = Role;

  taskMode: boolean = true;

  post: Post = {
    boardID: '1',
    postID: '1',
    userID: '1',
    author: 'ammar',
    type: PostType.BOARD,
    title: 'tile',
    desc: 'desc desc descdes descdescdescdescdescdescdescdescdescdescdescdescdescc',
    tags: [],
    displayAttributes: null,
  };
  htmlPost: HTMLPost;

  posts: HTMLPost[] = [];

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

    this.htmlPost = {
      post: this.post,
      board: this.board,
      author: 'me',
      likes: [],
      comments: 12,
      config: {
        hideAuthorName: false,
        allowMoveToBoard: false,
        allowExpand: true,
      },
    };
    this.posts.push(this.htmlPost, this.htmlPost, this.htmlPost, this.htmlPost);

    this.activeTasks = MOCK_ACTIVE_TASKS;
    this.inactiveTasks = MOCK_INACTIVE_TASKS;

    return true;
  }

  onSwiper(params: any) {
    console.log(params);
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
