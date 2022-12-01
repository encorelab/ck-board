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
  TaskActionType,
  TaskWorkflow,
  GroupTaskStatus,
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
import { MatTableDataSource } from '@angular/material/table';
import { TodoItem } from 'src/app/models/todoItem';
import { TodoItemService } from 'src/app/services/todoItem.service';
import { MatSort } from '@angular/material/sort';
import sorting from 'src/app/utils/sorting';
import { FormControl, FormGroup } from '@angular/forms';

SwiperCore.use([EffectCards]);

interface MonitorData {
  groupName: string;
  groupMembers: string[];
  progress: string;
}

class TodoItemDisplay {
  name: string;
  goal: string;
  deadline: string;
  completed: boolean;
  overdue: boolean;
}

@Component({
  selector: 'app-ck-monitor',
  templateUrl: './ck-monitor.component.html',
  styleUrls: ['./ck-monitor.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CkMonitorComponent implements OnInit, OnDestroy {
  @ViewChild(SwiperComponent) swiper: SwiperComponent;

  user: AuthUser;
  group: Group;

  project: Project;
  board: Board;

  showInactive = true;
  showActive = true;
  showCompleted = false;

  taskWorkflows: TaskWorkflow[] = [];
  inactiveTaskWorkflows: TaskWorkflow[] = [];
  activeTaskWorkflows: TaskWorkflow[] = [];
  completeTaskWorkflows: TaskWorkflow[] = [];

  taskWorkflowGroupMap: Map<TaskWorkflow, ExpandedGroupTask[]> = new Map<
    TaskWorkflow,
    ExpandedGroupTask[]
  >();
  taskWorkflowGroupNameMap: Map<TaskWorkflow, string[]> = new Map<
    TaskWorkflow,
    string[]
  >();

  runningTask: TaskWorkflow | null;
  runningTaskTableData: MatTableDataSource<MonitorData>;
  currentGroupProgress: number;
  averageGroupProgress: number;
  maxGroupProgress: number;
  minGroupProgress: number;
  listeners: Subscription[] = [];
  posts: HTMLPost[] = [];
  members: User[] = [];

  todoIsVisible: Boolean = false;
  todoItems: TodoItem[] = [];
  todoDataSource = new MatTableDataSource<TodoItemDisplay>();

  Role: typeof Role = Role;
  TaskActionType: typeof TaskActionType = TaskActionType;
  GroupTaskStatus: typeof GroupTaskStatus = GroupTaskStatus;

  range = new FormGroup({
    start: new FormControl(null),
    end: new FormControl(null),
  });

  displayColumns: string[] = ['group-name', 'members', 'progress'];
  todoColumns: string[] = [
    'name',
    'goal',
    'type',
    'status',
    'deadline',
    'rubric-score',
    'completion-notes',
  ];

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
    private converters: Converters,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog
  ) {
    this.todoDataSource.sortingDataAccessor = (data, sortHeaderId) => {
      switch (sortHeaderId) {
        case 'goal': {
          return sorting.caseInsensitive(data, sortHeaderId);
        }
        case 'deadline': {
          return sorting.caseInsensitive(data, sortHeaderId);
        }
        default: {
          return sorting.nestedCaseInsensitive(data, sortHeaderId);
        }
      }
    };
  }

  @ViewChild(MatSort) set matSort(sort: MatSort) {
    this.todoDataSource.sort = sort;
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

    this.board = await this.boardService.get(boardID);
    this.project = await this.projectService.get(projectID);
    this.todoItems = await this.todoItemService.getByProject(projectID);
    this.updateTodoItemDataSource();
    this.group = await this.groupService.getByProjectUser(
      projectID,
      this.user.userID
    );

    this.taskWorkflows = await this.workflowService.getActiveTasks(boardID);

    for (let i = 0; i < this.taskWorkflows.length; i++) {
      const groupTasks = await this.workflowService.getGroupTasksByWorkflow(
        this.taskWorkflows[i].workflowID,
        'expanded'
      );
      groupTasks.sort((a, b) =>
        this._calcGroupProgress(a) > this._calcGroupProgress(b) ? -1 : 1
      );
      this.taskWorkflowGroupMap.set(this.taskWorkflows[i], groupTasks);
      this.taskWorkflowGroupNameMap.set(
        this.taskWorkflows[i],
        groupTasks.map((group) => group.group.name)
      );
      let activeCount = 0,
        completedCount = 0;

      for (let i = 0; groupTasks && i < groupTasks.length; i++) {
        activeCount += Number(
          groupTasks[i].groupTask.status == GroupTaskStatus.ACTIVE
        );
        completedCount += Number(
          groupTasks[i].groupTask.status == GroupTaskStatus.COMPLETE
        );
      }
      if (!activeCount && !completedCount)
        this.inactiveTaskWorkflows.push(this.taskWorkflows[i]);
      else if (completedCount == groupTasks?.length)
        this.completeTaskWorkflows.push(this.taskWorkflows[i]);
      else this.activeTaskWorkflows.push(this.taskWorkflows[i]);
    }
    this.socketService.connect(this.user.userID, this.board.boardID);
    return true;
  }

  async updateTodoItemDataSource(): Promise<void> {
    const data: TodoItemDisplay[] = [];
    this.todoItems.forEach((item) => {
      const date = new Date(item.deadline.date);
      const formattedDate = date.toLocaleDateString('en-CA');
      const todo: TodoItemDisplay = {
        name: item.userID,
        goal: item.title,
        deadline: formattedDate,
        completed: item.completed,
        overdue: item.overdue,
      };
      data.push(todo);
    });

    this.todoDataSource.data = data;
  }

  clearTodoFilter(): void {
    this.updateTodoItemDataSource();
    this.range.reset();
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

  async view(task: TaskWorkflow): Promise<void> {
    this.runningTask = task;
    const progressData = await this._calcAverageProgress(
      this.taskWorkflowGroupMap.get(this.runningTask)
    );
    this.minGroupProgress = progressData[0];
    this.averageGroupProgress = progressData[1];
    this.maxGroupProgress = progressData[2];
    await this.updateRunningTaskDataSource(task);
    this._startListening();
  }

  async updateRunningTaskDataSource(workflow: TaskWorkflow): Promise<void> {
    const groupTasks = this.taskWorkflowGroupMap.get(workflow);
    const groupTasksTableFormat: MonitorData[] = [];
    if (groupTasks) {
      for (let i = 0; i < groupTasks.length; i++) {
        const groupMembers: string[] = [];
        for (let j = 0; j < groupTasks[i].group.members.length; j++) {
          groupMembers.push(
            (await this.userService.getOneById(groupTasks[i].group.members[j]))
              .username
          );
        }
        groupTasksTableFormat.push({
          groupName: groupTasks[i].group.name,
          progress: this._calcGroupProgress(groupTasks[i]).toFixed(2),
          groupMembers: groupMembers,
        });
      }
    }
    this.runningTaskTableData = new MatTableDataSource<MonitorData>(
      groupTasksTableFormat
    );
  }

  close(): void {
    this.runningTask = null;
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
            const progressData = await this._calcAverageProgress(groupTasks);
            await this.updateRunningTaskDataSource(found.workflow);
            this.minGroupProgress = progressData[0];
            this.averageGroupProgress = progressData[1];
            this.maxGroupProgress = progressData[2];
          }
        }
      )
    );
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
