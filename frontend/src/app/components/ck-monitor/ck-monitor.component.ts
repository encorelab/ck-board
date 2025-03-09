import { ComponentType } from '@angular/cdk/overlay';
import {
  Component,
  OnDestroy,
  Input,
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
  TaskActionType,
  TaskWorkflow,
  GroupTaskStatus,
  TaskWorkflowType,
  Workflow,
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
  EXPANDED_TODO_TYPE,
  SocketEvent,
  TODO_TYPE_COLORS,
  EXPANDED_COMPLETION_QUALITY,
} from 'src/app/utils/constants';
import { SocketService } from 'src/app/services/socket.service';
import { Subscription } from 'rxjs';
import { ManageGroupModalComponent } from '../groups/manage-group-modal/manage-group-modal.component';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import {
  CompletionQuality,
  ExpandedTodoItem,
  TodoItem,
  TodoItemType,
} from 'src/app/models/todoItem';
import { TodoItemService } from 'src/app/services/todoItem.service';
import { MatSort } from '@angular/material/sort';
import sorting from 'src/app/utils/sorting';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { TodoItemCardModalComponent } from '../todo-item-card-modal/todo-item-card-modal.component';
import { LearnerService } from 'src/app/services/learner.service';

SwiperCore.use([EffectCards]);

interface MonitorData {
  groupName: string;
  groupMembers: string[];
  groupTaskID: string;
  progress: string;
  workflowID: string;
  taskWorkflow: TaskWorkflow;
  groupTaskStatus: GroupTaskStatus;
}

interface GroupName {
  groupName: string;
  groupStatus: GroupTaskStatus;
}

class TodoItemDisplay {
  name: string;
  goal: string;
  deadline: string;
  status: string;
  completed: boolean;
  quality?: string;
  overdue: boolean;
  types: TodoItemType[];
  todoItem: TodoItem;
}

@Component({
  selector: 'app-ck-monitor',
  templateUrl: './ck-monitor.component.html',
  styleUrls: ['./ck-monitor.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CkMonitorComponent implements OnInit, OnDestroy {
  @ViewChild(SwiperComponent) swiper: SwiperComponent;
  @ViewChild(MatSort) set matSort(sort: MatSort) {
    this.todoDataSource.sort = sort;
  }

  @Input() isModalView = false;
  @Input() projectID: string;
  @Input() boardID: string;
  @Input() embedded: boolean = false;

  user: AuthUser;
  group: Group;

  project: Project;
  board: Board;

  showPending = false;
  showActive = false;
  showCompleted = false;

  taskWorkflows: TaskWorkflow[] = [];
  pendingTaskWorkflows: TaskWorkflow[] = [];
  activeTaskWorkflows: TaskWorkflow[] = [];
  completeTaskWorkflows: TaskWorkflow[] = [];

  // New map for Pending Task data
  pendingTaskWorkflowGroupMap: Map<TaskWorkflow, ExpandedGroupTask[]> = new Map<
    TaskWorkflow,
    ExpandedGroupTask[]
  >();

  taskWorkflowGroupMap: Map<TaskWorkflow, ExpandedGroupTask[]> = new Map<
    TaskWorkflow,
    ExpandedGroupTask[]
  >();

  taskWorkflowNameMap: Map<TaskWorkflow, GroupName[]> = new Map<
    TaskWorkflow,
    GroupName[]
  >();

  taskWorkflowGroupNameMap: Map<TaskWorkflow, string[]> = new Map<
    TaskWorkflow,
    string[]
  >();

  taskWorkflowCompleteGroupNameMap: Map<TaskWorkflow, string[]> = new Map<
    TaskWorkflow,
    string[]
  >();

  runningTask: TaskWorkflow | null;
  runningTaskGroupStatus: GroupTaskStatus | null;
  runningTaskTableData: MatTableDataSource<MonitorData>;

  currentGroupProgress: number;
  averageGroupProgress: number;
  maxGroupProgress: number;
  minGroupProgress: number;
  listeners: Subscription[] = [];
  posts: HTMLPost[] = [];
  members: User[] = [];

  todoIsVisible: Boolean = false;
  todoItems: ExpandedTodoItem[] = [];
  todoDataSource = new MatTableDataSource<TodoItemDisplay>();
  todoItemColors = TODO_TYPE_COLORS;
  todoItemTypes = EXPANDED_TODO_TYPE;
  todoColumns: string[] = [
    'name',
    'goal',
    'type',
    'status',
    'deadline',
    'completion-quality',
    'completion-notes',
  ];

  todoDeadlineRange = new UntypedFormGroup({
    start: new UntypedFormControl(null),
    end: new UntypedFormControl(null),
  });

  Role: typeof Role = Role;
  TaskActionType: typeof TaskActionType = TaskActionType;
  GroupTaskStatus: typeof GroupTaskStatus = GroupTaskStatus;

  displayColumns: string[] = ['group-name', 'members', 'progress', 'action'];
  displayColumnsIndividual: string[] = [
    'member-name',
    'group-name',
    'progress',
    'action',
  ];
  loading: boolean = true;

  showModels = false;

  studentView = false;
  viewType = ViewType.MONITOR;
  isTeacher: boolean = false;

  constructor(
    public userService: UserService,
    public projectService: ProjectService,
    public boardService: BoardService,
    public postService: PostService,
    public workflowService: WorkflowService,
    public groupService: GroupService,
    public socketService: SocketService,
    public snackbarService: SnackbarService,
    public todoItemService: TodoItemService,
    public learnerService: LearnerService,
    private converters: Converters,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog
  ) {
    this.todoDataSource.sortingDataAccessor = (data, sortHeaderId) => {
      switch (sortHeaderId) {
        default: {
          return sorting.nestedCaseInsensitive(data, sortHeaderId);
        }
      }
    };
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params.embedded === 'true') {
        this.embedded = true;
      }
    });
  }

  async ngOnInit(): Promise<void> {
    this.user = this.userService.user!;
    this.isTeacher = this.user.role === Role.TEACHER;
    if (this.user.role === Role.STUDENT) {
      this.studentView = true;
      this.loading = false;
    }

    // Prioritize Input properties.  If they are provided, use them.
    if (this.projectID && this.boardID) {
      await this.loadWorkspaceData(); // Load with Input IDs
      this.socketService.connect(this.user.userID, this.boardID);
    } else {
      // Fallback to ActivatedRoute *ONLY* if inputs are not provided.
      this.activatedRoute.paramMap.subscribe(async (params) => {
        this.boardID = params.get('boardID')!;
        this.projectID = params.get('projectID')!;

        if (!this.boardID || !this.projectID) {
          console.error('Missing boardID or projectID in route parameters');
          this.router.navigate(['/error']); // Redirect to an error page
          return; // Stop execution
        }

        await this.loadWorkspaceData();
        this.socketService.connect(this.user.userID, this.boardID);
      });
    }
  }

  async loadWorkspaceData(): Promise<boolean> {
    // No longer need to get from route since we prioritize inputs
    if (!this.boardID || !this.projectID) {
      console.error('boardId or projectId is null');
      return false;
    }

    const fetchedBoard = await this.boardService.get(this.boardID);
    if (!fetchedBoard) {
      console.error('board not found');
      this.router.navigate(['error']);
      return false;
    }
    this.board = fetchedBoard;
    this.project = await this.projectService.get(this.projectID);
    //get group may return undefined.
    try {
      this.group = await this.groupService.getByProjectUser(
        this.projectID,
        this.user.userID
      );
    } catch (error: any) {
      console.error('Could not fetch group');
    }

    if (!this.isTeacher && !this.board.viewSettings?.allowMonitor) {
      this.router.navigateByUrl(
        `project/<span class="math-inline">{this.projectID}/board/</span>{this.boardID}/${this.board.defaultView?.toLowerCase()}`
      );
    }

    if (!this.studentView)
      await this.updateWorkflowData(this.boardID, this.projectID);

    return true;
  }

  async updateWorkflowData(boardID, projectID) {
    const pendingTaskWorkflows: TaskWorkflow[] = [];
    const completeTaskWorkflows: TaskWorkflow[] = [];
    const activeTaskWorkflows: TaskWorkflow[] = [];

    this.todoItems = await this.todoItemService.getByProject(
      projectID,
      'expanded'
    );
    if (this.board.defaultTodoDateRange) {
      const start = new Date(this.board.defaultTodoDateRange.start);
      const end = new Date(this.board.defaultTodoDateRange.end);
      this.todoDeadlineRange.setValue({ start, end });
      this.filterTodosByDeadline(start, end);
    } else {
      this.updateTodoItemDataSource();
    }
    this.group = await this.groupService.getByProjectUser(
      projectID,
      this.user.userID
    );

    const workflows = await this.workflowService.getAll(this.board.boardID);
    this.taskWorkflows = workflows.filter(this._isTaskWorkflow);
    this.taskWorkflows = this.taskWorkflows.filter(
      (workflow) => workflow.active === true
    );

    // Reset maps for new data
    this.pendingTaskWorkflowGroupMap = new Map<
      TaskWorkflow,
      ExpandedGroupTask[]
    >();
    this.taskWorkflowGroupMap = new Map<TaskWorkflow, ExpandedGroupTask[]>();
    this.taskWorkflowNameMap = new Map<TaskWorkflow, GroupName[]>();
    this.taskWorkflowGroupNameMap = new Map<TaskWorkflow, string[]>(); //Probably not needed anymore
    this.taskWorkflowCompleteGroupNameMap = new Map<TaskWorkflow, string[]>(); //Probably not needed anymore.

    for (let i = 0; i < this.taskWorkflows.length; i++) {
      const workflow = this.taskWorkflows[i];
      const groupTasks = await this.workflowService.getGroupTasksByWorkflow(
        workflow.workflowID,
        'expanded'
      );
      groupTasks.sort((a, b) =>
        this._calcGroupProgress(a) > this._calcGroupProgress(b) ? -1 : 1
      );

      this.taskWorkflowGroupMap.set(workflow, groupTasks);

      // Create a map entry for *every* workflow, but we'll filter *later* in the HTML.
      this.taskWorkflowNameMap.set(
        workflow,
        groupTasks.map((gt) => ({
          groupName: gt.group.name,
          groupStatus: gt.groupTask.status,
        }))
      );

      const pendingGroupTasks = groupTasks.filter(
        (gt) => gt.groupTask.status === GroupTaskStatus.INACTIVE
      );
      const activeGroupTasks = groupTasks.filter(
        (gt) => gt.groupTask.status === GroupTaskStatus.ACTIVE
      );
      const completedGroupTasks = groupTasks.filter(
        (gt) => gt.groupTask.status === GroupTaskStatus.COMPLETE
      );

      if (pendingGroupTasks.length > 0) {
        this.pendingTaskWorkflowGroupMap.set(workflow, pendingGroupTasks);
        if (!pendingTaskWorkflows.includes(workflow)) {
          pendingTaskWorkflows.push(workflow);
        }
      }

      if (activeGroupTasks.length > 0) {
        if (!activeTaskWorkflows.includes(workflow)) {
          activeTaskWorkflows.push(workflow);
        }
      }
      if (completedGroupTasks.length > 0) {
        if (!completeTaskWorkflows.includes(workflow)) {
          completeTaskWorkflows.push(workflow);
        }
      }
    }

    this.pendingTaskWorkflows = pendingTaskWorkflows;
    this.completeTaskWorkflows = completeTaskWorkflows;
    this.activeTaskWorkflows = activeTaskWorkflows;
    this.loading = false;
  }

  _isTaskWorkflow(workflow: Workflow): workflow is TaskWorkflow {
    return (workflow as TaskWorkflow).requiredActions !== undefined;
  }

  async updateTodoItemDataSource(): Promise<void> {
    const data: TodoItemDisplay[] = [];

    for (const todoItem of this.todoItems) {
      const item = todoItem.todoItem;
      const date = new Date(`${item.deadline.date} ${item.deadline.time}`);
      const formattedDate = date.toLocaleDateString('en-CA');
      const currentDate = new Date();
      const name = todoItem.group
        ? todoItem.group.name
        : todoItem.user.username;
      const overdue = date < currentDate && !item.completed;
      const todo: TodoItemDisplay = {
        name: name,
        goal: item.title,
        deadline: formattedDate,
        status: overdue ? 'Missed' : item.completed ? 'Complete' : 'Pending',
        quality: item.quality ? EXPANDED_COMPLETION_QUALITY[item.quality] : '',
        types: item.type,
        completed: item.completed,
        overdue: overdue,
        todoItem: todoItem.todoItem,
      };
      data.push(todo);
    }
    this.todoDataSource.data = data;
  }

  clearTodoFilter(): void {
    this.updateTodoItemDataSource();
    this.todoDeadlineRange.reset();
  }

  // New method to calculate pending/total for a workflow
  getPendingTotal(workflow: TaskWorkflow): string {
    const pendingGroupTasks =
      this.pendingTaskWorkflowGroupMap.get(workflow) || [];
    let pendingCount = 0;
    let totalCount = 0;

    for (const groupTask of pendingGroupTasks) {
      if (groupTask.assignmentType === 'GROUP' || !groupTask.assignmentType) {
        for (const memberId of groupTask.group.members) {
          totalCount++;
          if (groupTask.groupTask.status === GroupTaskStatus.INACTIVE) {
            pendingCount++;
          }
        }
      } else {
        // Individual assignment
        totalCount++;
        if (groupTask.groupTask.status === GroupTaskStatus.INACTIVE) {
          pendingCount++;
        }
      }
    }
    if (totalCount == 0 && this.taskWorkflowGroupMap.has(workflow)) {
      const expandedGroupTasks = this.taskWorkflowGroupMap.get(workflow);
      expandedGroupTasks?.forEach((groupTask) => {
        if (groupTask.assignmentType === 'GROUP' || !groupTask.assignmentType) {
          totalCount += groupTask.group.members.length;
        } else {
          totalCount += 1;
        }
      });
    }
    return `${pendingCount}/${totalCount}`;
  }

  filterTodosByDeadline(start: Date, end: Date): void {
    if (!start || !end) return;
    this.updateTodoItemDataSource();
    this.todoDataSource.data = this.todoDataSource.data.filter((item) => {
      const date = new Date(item.deadline);
      const adjustedDate = new Date(
        date.getTime() + Math.abs(date.getTimezoneOffset() * 60000)
      );
      return adjustedDate <= end && adjustedDate >= start;
    });
  }

  setDefaultRange(start: Date, end: Date): void {
    if (!start || !end) return;
    this.filterTodosByDeadline(start, end);
    const defaultTodoDateRange = { start, end };
    this.boardService.update(this.board.boardID, { defaultTodoDateRange });
  }

  async view(task: TaskWorkflow, status: GroupTaskStatus): Promise<void> {
    this.runningTask = task;
    this.todoIsVisible = false;
    this.runningTaskGroupStatus = status;
    this.showModels = false;
    const progressData = await this._calcAverageProgress(
      this.taskWorkflowGroupMap.get(this.runningTask)
    );
    this.minGroupProgress = progressData[0];
    this.averageGroupProgress = progressData[1];
    this.maxGroupProgress = progressData[2];
    await this.updateRunningTaskDataSource(task, status);
    this._startListening();
  }

  async updateRunningTaskDataSource(
    workflow: TaskWorkflow,
    status: GroupTaskStatus
  ): Promise<void> {
    const groupTasks = this.taskWorkflowGroupMap.get(workflow);
    const groupTasksTableFormat: MonitorData[] = [];

    if (groupTasks) {
      for (let i = 0; i < groupTasks.length; i++) {
        // *** FILTER HERE, based on the requested status ***
        if (groupTasks[i].groupTask.status !== status) {
          continue; // Skip this groupTask if it doesn't match the desired status
        }

        const groupMembers: string[] = [];
        if (
          groupTasks[i].assignmentType === 'GROUP' ||
          !groupTasks[i].assignmentType
        ) {
          for (let j = 0; j < groupTasks[i].group.members.length; j++) {
            groupMembers.push(
              (
                await this.userService.getOneById(
                  groupTasks[i].group.members[j]
                )
              ).username
            );
          }
          groupTasksTableFormat.push({
            groupName: groupTasks[i].group.name,
            progress: this._calcGroupProgress(groupTasks[i]).toFixed(2),
            groupMembers: groupMembers,
            groupTaskID: groupTasks[i].groupTask.groupTaskID,
            workflowID: groupTasks[i].workflow.workflowID,
            taskWorkflow: groupTasks[i].workflow,
            groupTaskStatus: groupTasks[i].groupTask.status,
          });
        } else {
          const user = await this.userService.getOneById(
            groupTasks[i].groupTask.userID!
          );
          groupTasksTableFormat.push({
            groupName: groupTasks[i].group.name,
            progress: this._calcGroupProgress(groupTasks[i]).toFixed(2),
            groupMembers: [user.username],
            groupTaskID: groupTasks[i].groupTask.groupTaskID,
            workflowID: groupTasks[i].workflow.workflowID,
            taskWorkflow: groupTasks[i].workflow,
            groupTaskStatus: groupTasks[i].groupTask.status,
          });
        }
      }
    }
    this.runningTaskTableData = new MatTableDataSource<MonitorData>(
      groupTasksTableFormat
    );
  }

  async activateGroupTask(_group: MonitorData) {
    this.loading = true;
    const updatedGroupTask = await this.workflowService.markGroupTaskActive(
      _group.groupTaskID
    );
    await this.updateWorkflowData(this.board.boardID, this.project.projectID);
    const updatedData = this.runningTaskTableData.data.map((data) => {
      if (data.groupTaskID === _group.groupTaskID) {
        return {
          ...data,
          groupTaskStatus: GroupTaskStatus.ACTIVE,
        };
      }
      return data;
    });
    this.runningTaskTableData.data = updatedData;
  }

  async completeGroupTask(_group: MonitorData) {
    this.loading = true;
    const updatedGroupTask = await this.workflowService.markGroupTaskComplete(
      _group.groupTaskID
    );
    await this.updateWorkflowData(this.board.boardID, this.project.projectID);
    const updatedData = this.runningTaskTableData.data.map((data) => {
      if (data.groupTaskID === _group.groupTaskID) {
        return {
          ...data,
          groupTaskStatus: GroupTaskStatus.COMPLETE,
        };
      }
      return data;
    });
    this.runningTaskTableData.data = updatedData;
    const allTasksComplete = updatedData.every(
      (data) => data.groupTaskStatus === GroupTaskStatus.COMPLETE
    );
    if (allTasksComplete) {
      this.runningTask = null;
    }
  }

  close(): void {
    this.runningTask = null;
    this.runningTaskGroupStatus = null;
    this.runningTaskTableData = new MatTableDataSource<MonitorData>();
    this.minGroupProgress = 0;
    this.averageGroupProgress = 0;
    this.maxGroupProgress = 0;
    this.listeners.map((l) => l.unsubscribe());
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

  toggleModels(): void {
    if (this.showModels) {
      this.showModels = false;
    } else {
      this.todoIsVisible = false;
      this.runningTask = null;
      this.showModels = true;
    }
  }

  toggleTodos(): void {
    if (this.todoIsVisible) {
      this.todoIsVisible = false;
    } else {
      this.showModels = false;
      this.runningTask = null;
      this.todoIsVisible = true;
    }
  }

  openGroupDialog(): void {
    this.dialog.open(ManageGroupModalComponent, {
      data: {
        project: this.project,
      },
    });
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
        async (updates) => {
          const found = updates.find(
            (u) => u.workflow.workflowID == this.runningTask?.workflowID
          );
          if (found) {
            const groupTasks =
              await this.workflowService.getGroupTasksByWorkflow(
                found.workflow.workflowID,
                'expanded'
              );
            groupTasks.sort((a, b) =>
              this._calcGroupProgress(a) > this._calcGroupProgress(b) ? -1 : 1
            );
            this.taskWorkflowGroupMap.set(found.workflow, groupTasks);
            this.runningTask = found.workflow;
            this.runningTaskGroupStatus = GroupTaskStatus.ACTIVE;
            const progressData = await this._calcAverageProgress(groupTasks);
            await this.updateRunningTaskDataSource(
              found.workflow,
              GroupTaskStatus.ACTIVE
            );
            this.minGroupProgress = progressData[0];
            this.averageGroupProgress = progressData[1];
            this.maxGroupProgress = progressData[2];
          }
        }
      )
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

  async openTodoItemViewModal(rowElement: TodoItemDisplay) {
    this.dialog.open(TodoItemCardModalComponent, {
      width: '500px',
      data: {
        todoItem: rowElement.todoItem,
        projectID: this.project.projectID,
        userID: this.user.userID,
        group: rowElement.todoItem.groupID
          ? await this.groupService.getById(rowElement.todoItem.groupID)
          : null,
        onComplete: async (t: TodoItem) => {
          this.todoItems = await this.todoItemService.getByProject(
            this.project.projectID,
            'expanded'
          );
          this.updateTodoItemDataSource();
        },
        onEdit: async (t: TodoItem) => {
          this.todoItems = await this.todoItemService.getByProject(
            this.project.projectID,
            'expanded'
          );
          this.updateTodoItemDataSource();
        },
        onRestore: async (t: TodoItem) => {
          this.todoItems = await this.todoItemService.getByProject(
            this.project.projectID,
            'expanded'
          );
          this.updateTodoItemDataSource();
        },
      },
    });
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
    tasks: ExpandedGroupTask[] | undefined
  ): Promise<number[]> {
    if (!tasks) return [0, 0, 0];
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
