import { ComponentType } from '@angular/cdk/overlay';
import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Board, BoardScope, ViewType } from 'src/app/models/board';
import { Project } from 'src/app/models/project';
import User, { AuthUser, Role } from 'src/app/models/user';
import {
  ExpandedGroupTask,
  GroupTask,
  GroupTaskStatus,
  TaskAction,
  TaskActionType,
  TaskWorkflowType,
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
import {
  NEEDS_ATTENTION_TAG,
  POST_TAGGED_BORDER_THICKNESS,
  STUDENT_POST_COLOR,
  TEACHER_POST_COLOR,
  SocketEvent,
} from 'src/app/utils/constants';
import { SocketService } from 'src/app/services/socket.service';
import { interval, Subscription } from 'rxjs';
import { ManageGroupModalComponent } from '../groups/manage-group-modal/manage-group-modal.component';
import { AddPostComponent } from '../add-post-modal/add-post.component';
import Post, { DisplayAttributes, PostType } from 'src/app/models/post';
import { CanvasService } from 'src/app/services/canvas.service';
import { GroupTaskService } from 'src/app/services/groupTask.service';

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

  loading = false;

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

  runningGroupTask: ExpandedGroupTask | null;
  currentGroupProgress: number;
  averageGroupProgress: number;
  listeners: Subscription[] = [];
  posts: HTMLPost[] = [];
  submittedPosts: HTMLPost[] = [];
  members: User[] | undefined = [];

  showSubmittedPosts: boolean = false;

  Role: typeof Role = Role;
  TaskActionType: typeof TaskActionType = TaskActionType;
  TaskWorkflowType: typeof TaskWorkflowType = TaskWorkflowType;
  GroupTaskStatus: typeof GroupTaskStatus = GroupTaskStatus;
  embedded: boolean = false; // If standalone board embed
  viewType = ViewType.WORKSPACE;

  constructor(
    public userService: UserService,
    public projectService: ProjectService,
    public boardService: BoardService,
    public postService: PostService,
    public workflowService: WorkflowService,
    public groupService: GroupService,
    public socketService: SocketService,
    public snackbarService: SnackbarService,
    public canvasService: CanvasService,
    public groupTaskService: GroupTaskService,
    private converters: Converters,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog
  ) {
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params.embedded === 'true') {
        this.embedded = true;
      }
    });
  }

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

    const fetchedBoard = await this.boardService.get(boardID);
    if (!fetchedBoard) {
      this.router.navigate(['error']);
      return false; // or true depending on your flow
    }
    this.board = fetchedBoard;
    this.project = await this.projectService.get(projectID);
    this.group = await this.groupService.getByProjectUser(
      projectID,
      this.user.userID
    );

    if (!this.board.viewSettings?.allowWorkspace) {
      this.router.navigateByUrl(
        `project/${projectID}/board/${boardID}/${this.board.defaultView?.toLowerCase()}`
      );
    }

    const tasks = await this.workflowService.getGroupTasks(boardID, 'expanded');
    tasks.forEach((t) => {
      if (t.groupTask.status == GroupTaskStatus.INACTIVE) {
        this.inactiveGroupTasks.push(t);
      } else if (t.groupTask.status == GroupTaskStatus.ACTIVE) {
        this.activeGroupTasks.push(t);
      } else if (t.groupTask.status == GroupTaskStatus.COMPLETE) {
        this.completeGroupTasks.push(t);
      }
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
    this.view(expandedGroupTask);
  }

  async view(groupTask: ExpandedGroupTask): Promise<void> {
    this.loading = true;
    this.runningGroupTask = groupTask;
    this.runningGroupTask.groupTask = await this.groupTaskService.getGroupTask(
      this.runningGroupTask.group.groupID,
      this.runningGroupTask.workflow.workflowID
    );
    this.currentGroupProgress = this._calcGroupProgress(this.runningGroupTask);
    this.averageGroupProgress = await this._calcAverageProgress(
      this.runningGroupTask
    );

    let postIDs: string[] = [];
    if (groupTask.groupTask.status == GroupTaskStatus.COMPLETE) {
      postIDs = postIDs.concat(Object.keys(groupTask.groupTask.progress));
    } else {
      postIDs = postIDs.concat(groupTask.groupTask.posts);
    }
    const submittedPostIDs = [
      ...Object.keys(groupTask.groupTask.progress),
    ].filter(
      (postID) =>
        groupTask.groupTask.progress[postID].reduce(
          (partialSum, a) => partialSum + a.amountRequired,
          0
        ) == 0
    );
    const posts = await this.postService.getAll(postIDs);
    const submittedPosts = await this.postService.getAll(submittedPostIDs);
    this.posts = await this.converters.toHTMLPosts(posts);
    this.submittedPosts = await this.converters.toHTMLPosts(submittedPosts);
    this.members = await this.userService.getMultipleByIds(
      groupTask.group.members
    );
    this.loading = false;
    // Show submitted posts by default in generative task workflow
    if (this.runningGroupTask.workflow.type === TaskWorkflowType.GENERATION) {
      this.showSubmittedPosts = true;
    } else {
      this.showSubmittedPosts = false;
    }

    this._startListening();
  }

  close(): void {
    this.runningGroupTask = null;
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
    // this.submittedPosts.push(post);
    this.currentGroupProgress = this._calcGroupProgress(this.runningGroupTask);
    if (this.currentGroupProgress >= 100) {
      await this.markComplete();
    }
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

  createMorePosts(groupTask: ExpandedGroupTask): boolean {
    return (
      groupTask.workflow.requiredActions.filter(
        (a) => a.type === TaskActionType.CREATE_POST
      )[0].amountRequired === Object.keys(groupTask.groupTask.progress).length
    );
  }

  taskSubmittable(groupTask: ExpandedGroupTask): boolean {
    return this.runningGroupTask?.workflow.type === TaskWorkflowType.GENERATION
      ? this.currentGroupProgress >= 100 &&
          groupTask.groupTask.status == GroupTaskStatus.ACTIVE
      : this.currentGroupProgress == 100 &&
          groupTask.groupTask.posts.length == 0 &&
          groupTask.groupTask.status == GroupTaskStatus.ACTIVE;
  }

  hasCommentRequirement(runningGroupTask: ExpandedGroupTask): boolean {
    return (
      runningGroupTask.workflow.requiredActions.find(
        (a) => a.type == TaskActionType.COMMENT
      ) != undefined
    );
  }

  hasTagRequirement(runningGroupTask: ExpandedGroupTask): boolean {
    return (
      runningGroupTask.workflow.requiredActions.find(
        (a) => a.type == TaskActionType.TAG
      ) != undefined
    );
  }

  hasCreatePostRequirement(runningGroupTask: ExpandedGroupTask): boolean {
    return (
      runningGroupTask.workflow.requiredActions.find(
        (a) => a.type == TaskActionType.CREATE_POST
      ) != undefined
    );
  }

  numberOfPosts(runningGroupTask: ExpandedGroupTask): number | undefined {
    return runningGroupTask.workflow.requiredActions.find(
      (a) => a.type == TaskActionType.CREATE_POST
    )?.amountRequired;
  }

  togglePostsSlider(): void {
    this.showSubmittedPosts = !this.showSubmittedPosts;
  }

  addPost(): void {
    const dialogData = {
      disableCreation: true,
      board: this.board,
      user: this.user,
      tagRequired: this.hasTagRequirement(this.runningGroupTask!),
      onComplete: async (post: Post) => {
        if (this.runningGroupTask) {
          post.type = PostType.WORKFLOW;
          const destinationType =
            PostType[this.runningGroupTask?.workflow.destinations[0].type];
          if (destinationType === PostType.BUCKET) {
            post.boardID = this.board.boardID;
          } else {
            const displayAttributes: DisplayAttributes = {
              position: {
                left: 150,
                top: 150,
              },
              lock: !this.board.permissions.allowStudentMoveAny,
              fillColor: this.defaultPostFill(),
            };
            post.boardID = this.runningGroupTask?.workflow.destinations[0].id;
            post.displayAttributes = displayAttributes;
          }
          const htmlPost = await this.converters.toHTMLPost(post);
          this.posts.push(htmlPost);
          this.postService.create(post);
          this.runningGroupTask.groupTask.progress[post.postID] =
            this.runningGroupTask.workflow.requiredActions.filter(
              (action) => action.type !== TaskActionType.CREATE_POST
            );
          this.runningGroupTask.groupTask.posts.push(post.postID);
          const t = await this.workflowService.updateGroupTask(
            this.runningGroupTask.groupTask.groupTaskID,
            {
              posts: this.posts.map((p) => p.post.postID),
              progress: this.runningGroupTask.groupTask.progress,
            }
          );

          this.currentGroupProgress = this._calcGroupProgress(
            this.runningGroupTask
          );
          this.averageGroupProgress = await this._calcAverageProgress(
            this.runningGroupTask
          );
          this.socketService.emit(SocketEvent.WORKFLOW_PROGRESS_UPDATE, [
            this.runningGroupTask.groupTask,
          ]);

          for (const _ of post.tags) {
            await this.onTagEvent(post.postID, 'add');
          }
          await this.submitPost(htmlPost);
        }
        return;
      },
    };
    this.dialog.open(AddPostComponent, {
      width: '500px',
      data: dialogData,
    });
  }

  onCommentEvent = async (postID: string, type: string): Promise<void> => {
    if (!this.runningGroupTask) return;

    const workflowID = this.runningGroupTask.workflow.workflowID;
    const groupTaskID = this.runningGroupTask.groupTask.groupTaskID;
    if (type == 'add') {
      await this.workflowService.updateTaskProgress(
        workflowID,
        groupTaskID,
        postID,
        -1,
        'COMMENT'
      );
    } else {
      await this.workflowService.updateTaskProgress(
        workflowID,
        groupTaskID,
        postID,
        1,
        'COMMENT'
      );
    }
    const post = this.posts.find((post) => post.post.postID === postID);
    if (post && this.postSubmittable(post)) {
      await this.submitPost(post);
    }
  };

  onTagEvent = async (postID: string, type: string): Promise<void> => {
    if (!this.runningGroupTask) return;

    const workflowID = this.runningGroupTask.workflow.workflowID;
    const groupTaskID = this.runningGroupTask.groupTask.groupTaskID;
    if (type == 'add') {
      await this.workflowService.updateTaskProgress(
        workflowID,
        groupTaskID,
        postID,
        -1,
        'TAG'
      );
    } else {
      await this.workflowService.updateTaskProgress(
        workflowID,
        groupTaskID,
        postID,
        1,
        'TAG'
      );
    }

    const post = this.posts.find((post) => post.post.postID === postID);
    if (post && this.postSubmittable(post)) {
      await this.submitPost(post);
    }
  };

  onDeleteEvent = async (postID: string): Promise<void> => {
    console.log('postID ', postID);
    if (!this.runningGroupTask) return;
    if (
      this.runningGroupTask.groupTask.status == GroupTaskStatus.COMPLETE ||
      this.runningGroupTask.groupTask.status == GroupTaskStatus.INACTIVE
    )
      return;
    if (this.runningGroupTask?.groupTask?.progress) {
      // Check if the key exists in progress
      if (postID in this.runningGroupTask.groupTask.progress) {
        delete this.runningGroupTask.groupTask.progress[postID];
        console.log(
          `Key ${postID} removed from runningGroupTask.groupTask.progress.`
        );
      } else {
        console.error(
          `Key ${postID} does not exist in runningGroupTask.groupTask.progress.`
        );
      }
    } else {
      console.error(
        'runningGroupTask.groupTask.progress is not defined or accessible.'
      );
    }
    const t = await this.workflowService.updateGroupTask(
      this.runningGroupTask.groupTask.groupTaskID,
      {
        posts: this.posts.map((p) => p.post.postID),
        progress: this.runningGroupTask.groupTask.progress,
      }
    );
    this.currentGroupProgress = this._calcGroupProgress(this.runningGroupTask);
    this.averageGroupProgress = await this._calcAverageProgress(
      this.runningGroupTask
    );
    this.socketService.emit(SocketEvent.WORKFLOW_PROGRESS_UPDATE, [
      this.runningGroupTask.groupTask,
    ]);
  };

  toggleSubmittedPosts(): void {
    this.showSubmittedPosts = !this.showSubmittedPosts;
  }

  private _startListening(): void {
    this.listeners.push(
      this.socketService.listen(
        SocketEvent.WORKFLOW_PROGRESS_UPDATE,
        async (updates) => {
          console.log('updates ', updates);
          if (!this.runningGroupTask) return;

          const found = updates.find(
            (u) => u.groupTaskID == this.runningGroupTask?.groupTask.groupTaskID
          );
          if (found) {
            this.runningGroupTask.groupTask = found;
            if (
              this.runningGroupTask?.workflow.type ===
              TaskWorkflowType.GENERATION
            ) {
              const _newPosts = found.posts.filter(
                (p) => !this.posts.map((post) => post.post.postID).includes(p)
              );
              const newPosts = await this.postService.getAll(_newPosts);
              const htmlPosts = await this.converters.toHTMLPosts(newPosts);
              this.posts = this.posts.concat(htmlPosts);
            }
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
          const submittedPost = this.posts.find((p) => p.post.postID == postID);
          this.posts = this.posts.filter((p) => p.post.postID != postID);
          if (submittedPost) this.submittedPosts.push(submittedPost);
        }
      )
    );
    this.listeners.push(
      interval(30 * 1000).subscribe(async () => {
        this.averageGroupProgress = await this._calcAverageProgress(
          this.runningGroupTask
        );
      })
    );
  }

  copyEmbedCode() {
    const url = window.location.href + '?embedded=true';
    navigator.clipboard.writeText(url);
  }

  signOut(): void {
    this.userService.logout();
    this.router.navigate(['login']);
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
    let remaining = values.reduce(
      (partialSum, a) =>
        partialSum + a.reduce((partial, b) => partial + b.amountRequired, 0),
      0
    );

    // nothing left to do
    if (remaining == 0 && task.workflow.type !== TaskWorkflowType.GENERATION)
      return 100;

    // sum both required tags (1) and required comments (1) = 2
    // multiple by number of posts since those requirements are per-post

    let total = task.workflow.requiredActions
      .filter((a) => a.type !== TaskActionType.CREATE_POST)
      .reduce((partialSum, a) => partialSum + a.amountRequired, 0);
    if (task.workflow.type === TaskWorkflowType.GENERATION) {
      const createPosts = task.workflow.requiredActions.filter(
        (a) => a.type === TaskActionType.CREATE_POST
      )[0].amountRequired;
      const postsCreated = Object.keys(task.groupTask.progress).length;

      const actionPerPost = total;
      if (total) total = total * createPosts + createPosts;
      else total = createPosts;
      remaining += createPosts - postsCreated;
      remaining += (createPosts - postsCreated) * actionPerPost;
    } else {
      total *= values.length;
    }
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

  defaultPostFill() {
    return this.userService.user?.role === Role.TEACHER
      ? TEACHER_POST_COLOR
      : STUDENT_POST_COLOR;
  }
}
