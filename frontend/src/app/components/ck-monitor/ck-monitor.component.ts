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
import User, { AuthUser, Role } from 'src/app/models/user';
import {
  ExpandedGroupTask,
  GroupTask,
  GroupTaskStatus,
  TaskAction,
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
import { ManageGroupModalComponent } from '../groups/manage-group-modal/manage-group-modal.component';

// install Swiper modules
SwiperCore.use([EffectCards]);

@Component({
  selector: 'app-ck-monitor',
  templateUrl: './ck-monitor.component.html',
  styleUrls: ['./ck-monitor.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CkMonitorComponent implements OnInit, OnDestroy {
  @ViewChild(SwiperComponent) swiper: SwiperComponent;

  showInactive = true;
  showActive = true;
  showCompleted = false;

  user: AuthUser;
  group: Group;

  project: Project;
  board: Board;

  inactiveGroupTasks: ExpandedGroupTask[] = [];
  activeGroupTasks: ExpandedGroupTask[] = [];
  completeGroupTasks: ExpandedGroupTask[] = [];
  expandedBoardTasks: ExpandedGroupTask[][] = [];
  taskWorkflows: TaskWorkflow[] = [];
  taskWorkflowGroupMap: Map<TaskWorkflow, ExpandedGroupTask[]> = new Map<
    TaskWorkflow,
    ExpandedGroupTask[]
  >();

  runningGroupTask: ExpandedGroupTask | null;
  runningTask: TaskWorkflow | null;
  currentGroupProgress: number;
  averageGroupProgress: number;
  maxGroupProgress: number;
  minGroupProgress: number;
  listeners: Subscription[] = [];
  posts: HTMLPost[] = [];
  members: User[] = [];

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

    this.taskWorkflows = await this.workflowService.getTask(boardID);
    console.log(this.taskWorkflows);

    for (let i = 0; i < this.taskWorkflows.length; i++) {
      console.log(this.taskWorkflows[i]);
      const groupTasks = await this.workflowService.getGroupTasksByWorkflow(
        this.taskWorkflows[i].workflowID,
        'expanded'
      );
      // groupTasks.sort((a, b) => a.groupTask.progress)
      this.taskWorkflowGroupMap.set(this.taskWorkflows[i], groupTasks);
    }
    console.log(this.taskWorkflowGroupMap);

    // const boardTasks = await this.workflowService.getTask(boardID);
    // for (let i = 0; i < boardTasks.length; i++) {
    //   this.expandedBoardTasks.push(
    //     await this.workflowService.getGroupTasksByWorkflow(
    //       boardTasks[i].workflowID,
    //       'expanded'
    //     )
    //   );
    // }
    // console.log(this.expandedBoardTasks);
    // console.log(boardTasks);

    // const tasks = await this.workflowService.getGroupTasks(boardID, 'expanded');
    // tasks.forEach((t) => {
    //   if (t.groupTask.status == GroupTaskStatus.INACTIVE) {
    //     this.inactiveGroupTasks.push(t);
    //   } else if (t.groupTask.status == GroupTaskStatus.ACTIVE) {
    //     this.activeGroupTasks.push(t);
    //   } else if (t.groupTask.status == GroupTaskStatus.COMPLETE) {
    //     this.completeGroupTasks.push(t);
    //   }
    // });
    // console.log(tasks);

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
    // this.view(expandedGroupTask);
  }

  async view(task: TaskWorkflow): Promise<void> {
    this.runningTask = task;
    //   this.runningGroupTask = groupTask;
    const progressData = await this._calcAverageProgress(
      this.taskWorkflowGroupMap.get(this.runningTask)
    );
    this.minGroupProgress = progressData[0];
    this.averageGroupProgress = progressData[1];
    this.maxGroupProgress = progressData[2];

    //   let postIDs: string[] = [];
    //   if (groupTask.groupTask.status == GroupTaskStatus.COMPLETE) {
    //     postIDs = postIDs.concat(Object.keys(groupTask.groupTask.progress));
    //   } else {
    //     postIDs = postIDs.concat(groupTask.groupTask.posts);
    //   }

    //   const posts = await this.postService.getAll(postIDs);
    //   this.posts = await this.converters.toHTMLPosts(posts);
    //   this.members = await this.userService.getMultipleByIds(
    //     groupTask.group.members
    //   );
    this._startListening();
  }

  close(): void {
    this.runningTask = null;
    this.currentGroupProgress = 0;
    this.averageGroupProgress = 0;
    this.posts = [];
    this.members = [];
    this.listeners.map((l) => l.unsubscribe());
  }

  async submitPost(post: HTMLPost): Promise<void> {
    if (!this.runningGroupTask) return;

    const task: GroupTask = this.runningGroupTask.groupTask;
    this.runningGroupTask.groupTask = await this.workflowService.submitPost(
      task.groupTaskID,
      post.post.postID
    );

    this.posts = this.posts.filter((p) => p.post.postID !== post.post.postID);
    this.currentGroupProgress = this._calcGroupProgress(this.runningGroupTask);
  }

  async markComplete(): Promise<void> {
    if (!this.runningGroupTask) return;

    const task: GroupTask = this.runningGroupTask.groupTask;
    this.runningGroupTask.groupTask =
      await this.workflowService.updateGroupTask(task.groupTaskID, {
        status: GroupTaskStatus.COMPLETE,
      });

    this.activeGroupTasks = this.activeGroupTasks.filter(
      (g) => g.groupTask.groupTaskID !== task.groupTaskID
    );
    this.completeGroupTasks.push(this.runningGroupTask);

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

  openGroupDialog(): void {
    this.dialog.open(ManageGroupModalComponent, {
      data: {
        project: this.project,
      },
    });
  }

  postSubmittable(post: HTMLPost): boolean {
    if (!this.runningGroupTask) return false;

    const progress = this.runningGroupTask.groupTask.progress;
    const postProgress = progress[post.post.postID];

    if (!postProgress) return false;

    const amountRequired = postProgress.reduce(
      (sum: number, a: TaskAction) => sum + a.amountRequired,
      0
    );

    return amountRequired == 0;
  }

  taskSubmittable(groupTask: ExpandedGroupTask): boolean {
    return (
      this.currentGroupProgress == 100 &&
      groupTask.groupTask.posts.length == 0 &&
      groupTask.groupTask.status == GroupTaskStatus.ACTIVE
    );
  }

  hasCommentRequirement(runningTask: TaskWorkflow): boolean {
    return (
      runningTask.requiredActions.find(
        (a) => a.type == TaskActionType.COMMENT
      ) != undefined
    );
  }

  hasTagRequirement(runningTask: TaskWorkflow): boolean {
    return (
      runningTask.requiredActions.find((a) => a.type == TaskActionType.TAG) !=
      undefined
    );
  }

  private _startListening(): void {
    this.listeners.push(
      this.socketService.listen(
        SocketEvent.WORKFLOW_PROGRESS_UPDATE,
        (updates) => {
          const found = updates.find(
            (u) =>
              u.groupTask.groupTaskID ==
              this.runningGroupTask?.groupTask.groupTaskID
          );
          if (found) {
            this.runningGroupTask = found;
            this.currentGroupProgress = this._calcGroupProgress(
              this.runningGroupTask
            );
          }
        }
      )
    );
    this.listeners.push(
      this.socketService.listen(SocketEvent.POST_UPVOTE_ADD, (result) => {
        const found = this.posts.find(
          (p) => p.post.postID == result.upvote.postID
        );
        if (found) {
          found.upvotes.push(result.upvote);
        }
      })
    );
    this.listeners.push(
      this.socketService.listen(SocketEvent.POST_UPVOTE_REMOVE, (result) => {
        const found = this.posts.find(
          (p) => p.post.postID == result.upvote.postID
        );
        if (found) {
          found.upvotes = found.upvotes.filter(
            (upvote) => upvote.upvoteID != result.upvote.upvoteID
          );
        }
      })
    );
    this.listeners.push(
      this.socketService.listen(SocketEvent.POST_COMMENT_ADD, (result) => {
        const found = this.posts.find(
          (p) => p.post.postID == result.comment.postID
        );
        if (found) {
          found.comments += 1;
        }
      })
    );
    this.listeners.push(
      this.socketService.listen(SocketEvent.POST_COMMENT_REMOVE, (result) => {
        const found = this.posts.find(
          (p) => p.post.postID == result.comment.postID
        );
        if (found) {
          found.comments -= 1;
        }
      })
    );
    this.listeners.push(
      this.socketService.listen(SocketEvent.POST_TAG_ADD, ({ post }) => {
        const found = this.posts.find((p) => p.post.postID == post.postID);
        if (found) {
          found.post = post;
        }
      })
    );
    this.listeners.push(
      this.socketService.listen(SocketEvent.POST_TAG_REMOVE, ({ post }) => {
        const found = this.posts.find((p) => p.post.postID == post.postID);
        if (found) {
          found.post = post;
        }
      })
    );
    this.listeners.push(
      this.socketService.listen(
        SocketEvent.WORKFLOW_POST_SUBMIT,
        (postID: string) => {
          this.posts = this.posts.filter((p) => p.post.postID != postID);
        }
      )
    );
    // this.listeners.push(
    //   interval(30 * 1000).subscribe(async () => {
    //     this.averageGroupProgress = await this._calcAverageProgress(
    //       this.runningGroupTask
    //     )[1];
    //   })
    // );
  }

  ngOnDestroy(): void {
    this.listeners.map((l) => l.unsubscribe());
    this.socketService.disconnect(this.user.userID, this.board.boardID);
  }

  private _calcGroupProgress(task: ExpandedGroupTask | null): number {
    if (!task) return 0;

    // get all posts' progress
    const values = Object.keys(task.groupTask.progress).map(function (key) {
      return task.groupTask.progress[key];
    });

    // sum all amountRequired for each action per post
    // i.e. Post A (1 tag req, 1 comment req) + Post B (1 tag req, 0 comments required)
    const remaining = values.reduce(
      (partialSum, a) =>
        partialSum + a.reduce((partial, b) => partial + b.amountRequired, 0),
      0
    );

    // nothing left to do
    if (remaining == 0) return 100;

    // sum both required tags (1) and required comments (1) = 2
    // multiple by number of posts since those requirements are per-post
    const total =
      task.workflow.requiredActions.reduce(
        (partialSum, a) => partialSum + a.amountRequired,
        0
      ) * values.length;

    return ((total - remaining) / total) * 100;
  }

  private async _calcAverageProgress(
    tasks: ExpandedGroupTask[] | undefined
  ): Promise<number[]> {
    if (!tasks) return [0, 0, 0];

    // const tasks: ExpandedGroupTask[] =
    //   await this.workflowService.getGroupTasksByWorkflow(
    //     task.workflow.workflowID,
    //     'expanded'
    //   );

    let totalProgress = 0;
    let _min = Infinity;
    let _max = -1 * Infinity;
    for (let i = 0; i < tasks.length; i++) {
      const groupProgress = this._calcGroupProgress(tasks[i]);
      _min = Math.min(_min, groupProgress);
      _max = Math.max(_max, groupProgress);
      totalProgress += groupProgress;
    }
    return [_min, totalProgress / tasks.length, _max];
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
