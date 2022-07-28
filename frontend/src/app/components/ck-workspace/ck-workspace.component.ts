import { ComponentType } from '@angular/cdk/overlay';
import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Board } from 'src/app/models/board';
import { Project } from 'src/app/models/project';
import { AuthUser, Role } from 'src/app/models/user';
import {
  ExpandedGroupTask,
  GroupTask,
  GroupTaskStatus,
  TaskActionType,
  TaskWorkflow,
} from 'src/app/models/workflow';
import { BoardService } from 'src/app/services/board.service';
import { ProjectService } from 'src/app/services/project.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { UserService } from 'src/app/services/user.service';
import { WorkflowService } from 'src/app/services/workflow.service';
import { BucketsModalComponent } from '../buckets-modal/buckets-modal.component';
import { ListModalComponent } from '../list-modal/list-modal.component';
import { SwiperComponent } from 'swiper/angular';
import SwiperCore, { EffectCards } from 'swiper';
import { HTMLPost } from '../html-post/html-post.component';
import { Group } from 'src/app/models/group';
import { GroupService } from 'src/app/services/group.service';
import Converters from 'src/app/utils/converters';
import { PostService } from 'src/app/services/post.service';
import { SocketEvent } from 'src/app/utils/constants';
import { SocketService } from 'src/app/services/socket.service';
import { interval, Subscription } from 'rxjs';

// install Swiper modules
SwiperCore.use([EffectCards]);

@Component({
  selector: 'app-ck-workspace',
  templateUrl: './ck-workspace.component.html',
  styleUrls: ['./ck-workspace.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CkWorkspaceComponent implements OnInit, OnDestroy {
  @ViewChild(SwiperComponent) swiper: SwiperComponent;

  showInactive = true;
  showActive = true;
  showCompleted = true;

  user: AuthUser;
  group: Group;

  project: Project;
  board: Board;

  inactiveGroupTasks: ExpandedGroupTask[] = [];
  activeGroupTasks: ExpandedGroupTask[] = [];
  completeGroupTasks: ExpandedGroupTask[] = [];

  runningGroupTask: ExpandedGroupTask | null;
  currentGroupProgress: number;
  averageGroupProgress: number;
  averageGroupProgressSub: Subscription;
  posts: HTMLPost[] = [];

  Role: typeof Role = Role;
  TaskActionType: typeof TaskActionType = TaskActionType;
  GroupTaskStatus: typeof GroupTaskStatus = GroupTaskStatus;

  constructor(
    public userService: UserService,
    public projectService: ProjectService,
    public boardService: BoardService,
    public postService: PostService,
    public workflowService: WorkflowService,
    public groupService: GroupService,
    public socketService: SocketService,
    public snackbarService: SnackbarService,
    private converters: Converters,
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
    this.group = await this.groupService.getByProjectUser(
      projectID,
      this.user.userID
    );

    const tasks = await this.workflowService.getGroupTasks(boardID, 'expanded');
    tasks.forEach((t) => {
      if (t.groupTask.status == GroupTaskStatus.INACTIVE)
        this.inactiveGroupTasks.push(t);
      else if (t.groupTask.status == GroupTaskStatus.ACTIVE)
        this.activeGroupTasks.push(t);
      else if (t.groupTask.status == GroupTaskStatus.COMPLETE)
        this.completeGroupTasks.push(t);
    });

    this.socketService.connect(this.user.userID, this.board.boardID);
    return true;
  }

  async begin(expandedGroupTask: ExpandedGroupTask): Promise<void> {
    const groupTask = expandedGroupTask.groupTask;
    groupTask.status = GroupTaskStatus.ACTIVE;
    await this.workflowService.updateGroupTask(groupTask.groupTaskID, {
      status: GroupTaskStatus.ACTIVE,
    });

    this.inactiveGroupTasks = this.inactiveGroupTasks.filter(
      (g) => g.groupTask.groupTaskID !== groupTask.groupTaskID
    );
    this.activeGroupTasks.push(expandedGroupTask);
    console.log(expandedGroupTask);
    this.view(expandedGroupTask);
  }

  async view(groupTask: ExpandedGroupTask): Promise<void> {
    this.runningGroupTask = groupTask;
    this.currentGroupProgress = this._calcGroupProgress(this.runningGroupTask);
    this.averageGroupProgress = await this._calcAverageProgress(
      this.runningGroupTask
    );

    const posts = await this.postService.getAll(
      this.runningGroupTask.groupTask.posts
    );
    this.posts = await this.converters.toHTMLPosts(posts);
    this._startListening();
  }

  close(): void {
    this.runningGroupTask = null;
    this.currentGroupProgress = 0;
    this.averageGroupProgress = 0;
    this.posts = [];
    this.averageGroupProgressSub.unsubscribe();
  }

  async submit(): Promise<void> {
    if (!this.runningGroupTask) return;

    const groupTask = await this.workflowService.updateGroupTask(
      this.runningGroupTask.groupTask.groupTaskID,
      { status: GroupTaskStatus.COMPLETE }
    );

    this.close();
  }

  showBucketsModal(): void {
    this._openDialog(BucketsModalComponent, {
      board: this.board,
      user: this.user,
      allowMovePostToBoard: false,
    });
  }

  showListModal(): void {
    this._openDialog(ListModalComponent, {
      board: this.board,
    });
  }

  private _startListening(): void {
    this.socketService.listen(
      SocketEvent.WORKFLOW_PROGRESS_UPDATE,
      (updates) => {
        const found = updates.find(
          (u) => u.groupTaskID == this.runningGroupTask?.groupTask.groupTaskID
        );
        if (found) {
          this.runningGroupTask = found;
          this.currentGroupProgress = this._calcGroupProgress(
            this.runningGroupTask
          );
        }
      }
    );
    this.socketService.listen(SocketEvent.POST_UPVOTE_ADD, (result: any) => {
      const found = this.posts.find(
        (p) => p.post.postID == result.upvote.postID
      );
      if (found) {
        found.upvotes.push(result.upvote);
      }
    });
    this.socketService.listen(SocketEvent.POST_UPVOTE_REMOVE, (result: any) => {
      const found = this.posts.find(
        (p) => p.post.postID == result.upvote.postID
      );
      if (found) {
        found.upvotes = found.upvotes.filter(
          (upvote) => upvote.upvoteID != result.upvote.upvoteID
        );
      }
    });
    this.socketService.listen(SocketEvent.POST_COMMENT_ADD, (result: any) => {
      const found = this.posts.find(
        (p) => p.post.postID == result.comment.postID
      );
      if (found) {
        found.comments += 1;
      }
    });
    this.socketService.listen(
      SocketEvent.POST_COMMENT_REMOVE,
      (result: any) => {
        const found = this.posts.find(
          (p) => p.post.postID == result.comment.postID
        );
        if (found) {
          found.comments -= 1;
        }
      }
    );
    this.socketService.listen(SocketEvent.POST_TAG_ADD, ({ post, tag }) => {
      const found = this.posts.find((p) => p.post.postID == post.postID);
      if (found) {
        found.post = post;
      }
    });
    this.socketService.listen(SocketEvent.POST_TAG_REMOVE, ({ post, _tag }) => {
      const found = this.posts.find((p) => p.post.postID == post.postID);
      if (found) {
        found.post = post;
      }
    });
    this.averageGroupProgressSub = interval(30 * 1000).subscribe(async () => {
      this.averageGroupProgress = await this._calcAverageProgress(
        this.runningGroupTask
      );
    });
  }

  ngOnDestroy(): void {
    this.socketService.disconnect(this.user.userID, this.board.boardID);
    if (this.averageGroupProgressSub)
      this.averageGroupProgressSub.unsubscribe();
  }

  private _calcGroupProgress(task: ExpandedGroupTask | null): number {
    if (!task) return 0;

    const remaining = task.groupTask.actions.reduce(
      (partialSum, a) => partialSum + a.amountRequired,
      0
    );
    const total = task.workflow.requiredActions.reduce(
      (partialSum, a) => partialSum + a.amountRequired,
      0
    );

    return ((total - remaining) / total) * 100;
  }

  private async _calcAverageProgress(
    task: ExpandedGroupTask | null
  ): Promise<number> {
    if (!task) return 0;

    const tasks: ExpandedGroupTask[] =
      await this.workflowService.getGroupTasksByWorkflow(
        task.workflow.workflowID,
        'expanded'
      );

    const totalProgress = tasks.reduce(
      (partialSum) => partialSum + this._calcGroupProgress(task),
      0
    );
    return totalProgress / tasks.length;
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