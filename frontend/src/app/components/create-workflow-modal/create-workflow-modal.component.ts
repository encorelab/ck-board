import { Component, Inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { MatSnackBarConfig } from '@angular/material/snack-bar';
import { Board, BoardScope } from 'src/app/models/board';
import { Tag } from 'src/app/models/tag';
import Bucket from 'src/app/models/bucket';
import { Group } from 'src/app/models/group';
import {
  Container,
  ContainerType,
  DistributionWorkflow,
  DistributionWorkflowType,
  TaskAction,
  TaskActionType,
  TaskWorkflow,
  WorkflowType,
  TaskWorkflowType,
} from 'src/app/models/workflow';
import { BoardService } from 'src/app/services/board.service';
import { BucketService } from 'src/app/services/bucket.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { GroupService } from 'src/app/services/group.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { WorkflowService } from 'src/app/services/workflow.service';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';
import { generateUniqueID } from 'src/app/utils/Utils';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-create-workflow-modal',
  templateUrl: './create-workflow-modal.component.html',
  styleUrls: ['./create-workflow-modal.component.scss'],
})
export class CreateWorkflowModalComponent implements OnInit {
  selected = new FormControl(0);

  board: Board;
  buckets: Bucket[];
  boardBuckets: Bucket[];
  workflows: any[] = [];
  tags: Tag[];
  upvoteLimit: number;
  selectedTag: string;

  bucketName = '';
  workflowName = '';
  showDelete = false;

  // Common fields between all workflows
  WorkflowType: typeof WorkflowType = WorkflowType;
  taskWorkflowType: typeof TaskWorkflowType = TaskWorkflowType;
  workflowType: WorkflowType = WorkflowType.GENERATION;
  sourceOptions: (Bucket | Board)[] = [];
  destOptions: (Bucket | Board)[] = [];

  // Fields for distribution workflow creation
  distributionSource: Board | Bucket;
  distributionDestinations: (Bucket | Board)[];
  postsPerBucket: number;
  distributionWorkflowType: DistributionWorkflowType;
  removeFromSource = false;

  // Fields for peer review workflow and generation task workflow creation
  groupOptions: Group[] = [];
  taskSource: Board | Bucket;
  taskDestination: Board | Bucket;
  prompt: string;
  assignedGroups: Group[] = [];
  commentsRequired = false;
  tagsRequired = false;
  postGeneration = 1;

  bucketNameFormControl = new FormControl('valid', [
    Validators.required,
    this._forbiddenNameValidator(),
  ]);
  workflowNameFormControl = new FormControl('valid', [Validators.required]);
  sourceFormControl = new FormControl('valid', [Validators.required]);
  destinationFormControl = new FormControl('valid', [Validators.required]);

  groupsFormControl = new FormControl('valid', [Validators.required]);
  promptFormControl = new FormControl('valid', [Validators.required]);

  workflowTypeFormControl = new FormControl('valid', [Validators.required]);
  removeFromSourceFormControl = new FormControl('valid', [Validators.required]);

  tagsFormControl = new FormControl();

  matcher = new MyErrorStateMatcher();
  snackbarConfig: MatSnackBarConfig;

  constructor(
    public dialogRef: MatDialogRef<CreateWorkflowModalComponent>,
    public dialog: MatDialog,
    private snackbarService: SnackbarService,
    public bucketService: BucketService,
    public boardService: BoardService,
    public workflowService: WorkflowService,
    public canvasService: CanvasService,
    public groupService: GroupService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.snackbarConfig = new MatSnackBarConfig();
    this.snackbarConfig.duration = 5000;
  }

  ngOnInit(): void {
    this.board = this.data.board;
    this.tags = this.data.board.tags;
    this.loadGroups();
    this.upvoteLimit = this.data.board.upvoteLimit;
    this.loadBucketsBoards();
    this.loadWorkflows();
  }

  async loadGroups() {
    this.groupOptions = await this.groupService.getByProjectId(
      this.data.project.projectID
    );
  }

  async loadBucketsBoards(): Promise<void> {
    this.sourceOptions = [];
    this.destOptions = [];
    this.boardBuckets = [];

    this.bucketService
      .getAllByBoard(this.data.board.boardID)
      .then((buckets) => {
        this.sourceOptions = this.sourceOptions.concat(buckets);
        this.destOptions = this.destOptions.concat(buckets);
        this.boardBuckets = this.boardBuckets.concat(buckets);
        this.sourceOptions.push(this.board);
      });
    this.boardService
      .getMultipleBy(this.data.project.boards, {
        scope: BoardScope.PROJECT_SHARED,
      })
      .then((data) => {
        data.forEach((board: Board) => {
          this.destOptions.push(board);
        });
      });
  }

  async loadWorkflows(): Promise<void> {
    return this.workflowService.getAll(this.board.boardID).then((workflows) => {
      this.workflows = [];
      workflows.forEach((workflow) => {
        this.workflows.push(workflow);
      });
    });
  }

  createBucket(): void {
    const bucket: Bucket = {
      bucketID: generateUniqueID(),
      boardID: this.data.board.boardID,
      name: this.bucketName,
      posts: [],
      addedToView: false,
    };

    this.bucketService.create(bucket).then(() => {
      this.loadBucketsBoards();
      this.openSnackBar('Bucket: ' + bucket.name + ' created succesfully!');
      this.bucketNameFormControl.reset();
      if (this.data?.onBucketCreation) {
        this.data?.onBucketCreation(bucket);
      }
    });
  }

  toggleDeleteBoard() {
    this.showDelete = !this.showDelete;
  }

  deleteBucket(bucket: Bucket) {
    this.dialog.open(ConfirmModalComponent, {
      width: '500px',
      data: {
        title: 'Confirmation',
        message: 'Are you sure you want to delete this bucket?',
        handleConfirm: () => {
          this.bucketService.delete(bucket.bucketID).then(() => {
            this.loadBucketsBoards();
            this.openSnackBar(
              'Bucket: ' + bucket.name + ' deleted succesfully!'
            );
          });
        },
      },
    });
  }

  createDistributionWorkflow(): void {
    if (!this._distributionWorkflowTypeSelected()) return;

    const workflow: DistributionWorkflow = this._assembleDistributionWorkflow();
    this.workflowService.createDistribution(workflow).then(async () => {
      await this.loadWorkflows();
      this.selected.setValue(2);
      this._clearWorkflowForm();
    });
  }

  createPeerReviewWorkflow(): void {
    if (!this._actionSelected()) return;

    const workflow: TaskWorkflow = this._assemblePeerReviewWorkflow();
    this.workflowService.createTask(workflow).then(async () => {
      await this.loadWorkflows();
      this.selected.setValue(2);
      this._clearWorkflowForm();
    });
  }

  createGenerationTaskWorkflow(): void {
    if (!this._validGenerationTaskWorkflow()) return;
    const workflow: TaskWorkflow = this._assembleGenerationTaskWorkflow();
    this.workflowService.createTask(workflow).then(async () => {
      await this.loadWorkflows();
      this.selected.setValue(2);
      this._clearWorkflowForm();
    });
  }

  runWorkflow(e, workflow: TaskWorkflow | DistributionWorkflow): void {
    e.stopPropagation();

    if (this._isTaskWorkflow(workflow)) {
      this.canvasService
        .runTaskWorkflow(workflow)
        .then(() => {
          workflow.active = true;
          this.openSnackBar('Workflow: ' + workflow.name + ' now active!');
        })
        .catch(() => {
          this.openSnackBar(
            'Unable to activate task workflow! Something went wrong.'
          );
        });
    } else {
      this.canvasService
        .runDistributionWorkflow(workflow)
        .then(async () => {
          this.openSnackBar(
            'Workflow: ' + workflow.name + ' completed successfully!'
          );
        })
        .catch(() => {
          this.openSnackBar('Cancelled workflow! Something went wrong.');
        });
    }
  }

  async deleteWorkflow(
    e,
    workflow: TaskWorkflow | DistributionWorkflow
  ): Promise<void> {
    e.stopPropagation();

    this.dialog.open(ConfirmModalComponent, {
      width: '500px',
      data: {
        title: 'Confirmation',
        message: 'Are you sure you want to delete this workflow?',
        handleConfirm: async () => {
          if (this._isTaskWorkflow(workflow)) {
            await this.workflowService.removeTask(workflow.workflowID);
          } else {
            await this.workflowService.removeDistribution(workflow.workflowID);
          }

          this.workflows = this.workflows.filter(
            (w) => w.workflowID !== workflow.workflowID
          );
        },
      },
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  openSnackBar(message: string): void {
    this.snackbarService.queueSnackbar(message);
  }

  _clearWorkflowForm() {
    this.workflowNameFormControl.reset();
    this.sourceFormControl.reset();
    this.destinationFormControl.reset();
    this.tagsFormControl.reset();
    this.workflowTypeFormControl.reset();
    this.removeFromSourceFormControl.reset();
    this.removeFromSource = false;
    this.postGeneration = 1;
  }

  _isBoard(object: Board | Bucket): object is Board {
    return (object as Board).tags !== undefined;
  }

  _isTaskWorkflow(
    object: DistributionWorkflow | TaskWorkflow
  ): object is TaskWorkflow {
    return (object as TaskWorkflow).requiredActions !== undefined;
  }

  _validDistributionWorkflow(): boolean {
    return (
      this.workflowNameFormControl.valid &&
      this.sourceFormControl.valid &&
      this.destinationFormControl.valid
    );
  }

  _ppbSelected(): boolean {
    return this.postsPerBucket != null && this.postsPerBucket > 0;
  }

  _distributionWorkflowTypeSelected() {
    return (
      (this.distributionWorkflowType === DistributionWorkflowType.RANDOM &&
        this.postsPerBucket > 0) ||
      (this.distributionWorkflowType === DistributionWorkflowType.UPVOTES &&
        this.upvoteLimit) ||
      (this.distributionWorkflowType === DistributionWorkflowType.TAG &&
        this.selectedTag)
    );
  }

  _distributionWorkflowTypeData() {
    if (this.distributionWorkflowType === DistributionWorkflowType.RANDOM)
      return this.postsPerBucket;
    else if (this.distributionWorkflowType === DistributionWorkflowType.UPVOTES)
      return this.upvoteLimit;
    else return this.selectedTag;
  }

  _assembleDistributionWorkflow(): DistributionWorkflow {
    const workflowID: string = generateUniqueID();

    const workflow: DistributionWorkflow = {
      workflowID: workflowID,
      boardID: this.board.boardID,
      active: false,
      name: this.workflowName,
      source: this._mapToContainer(this.distributionSource),
      destinations: this._mapToContainers(this.distributionDestinations),
      distributionWorkflowType: {
        type: this.distributionWorkflowType,
        data: this._distributionWorkflowTypeData(),
      },
      removeFromSource: this.removeFromSource,
    };

    return workflow;
  }

  _validPeerReviewWorkflow(): boolean {
    return (
      this.workflowNameFormControl.valid &&
      this.sourceFormControl.valid &&
      this.destinationFormControl.valid &&
      this.groupsFormControl.valid &&
      this.promptFormControl.valid &&
      this._actionSelected()
    );
  }

  _validGenerationTaskWorkflow(): boolean {
    return (
      this.workflowNameFormControl.valid &&
      this.destinationFormControl.valid &&
      this.groupsFormControl.valid &&
      this.promptFormControl.valid
    );
  }

  _actionSelected(): boolean {
    return this.commentsRequired || this.tagsRequired;
  }

  _assemblePeerReviewWorkflow(): TaskWorkflow {
    const workflowID: string = generateUniqueID();

    const actions: TaskAction[] = [];
    if (this.commentsRequired)
      actions.push({
        type: TaskActionType.COMMENT,
        amountRequired: 1,
      });
    if (this.tagsRequired)
      actions.push({
        type: TaskActionType.TAG,
        amountRequired: 1,
      });

    const workflow: TaskWorkflow = {
      workflowID: workflowID,
      boardID: this.board.boardID,
      active: false,
      name: this.workflowName,
      source: this._mapToContainer(this.taskSource),
      destinations: [this._mapToContainer(this.taskDestination)],
      prompt: this.prompt,
      requiredActions: actions,
      assignedGroups: this.assignedGroups.map((g) => g.groupID),
      type: this.taskWorkflowType.PEER_REVIEW,
    };

    return workflow;
  }

  _assembleGenerationTaskWorkflow(): TaskWorkflow {
    const workflowID: string = generateUniqueID();

    const actions: TaskAction[] = [];
    if (this.postGeneration)
      actions.push({
        type: TaskActionType.CREATE_POST,
        amountRequired: this.postGeneration,
      });
    if (this.commentsRequired)
      actions.push({
        type: TaskActionType.COMMENT,
        amountRequired: 1,
      });
    if (this.tagsRequired)
      actions.push({
        type: TaskActionType.TAG,
        amountRequired: 1,
      });

    const workflow: TaskWorkflow = {
      workflowID: workflowID,
      boardID: this.board.boardID,
      active: false,
      name: this.workflowName,
      source: this._placeholderContainer(),
      destinations: [this._mapToContainer(this.taskDestination)],
      prompt: this.prompt,
      requiredActions: actions,
      assignedGroups: this.assignedGroups.map((g) => g.groupID),
      type: this.taskWorkflowType.GENERATION,
    };

    return workflow;
  }

  _validBucketForm(): boolean {
    return this.bucketNameFormControl.valid;
  }

  _forbiddenNameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const forbidden = this.board ? control.value == this.board.name : false;
      return forbidden ? { forbidden: { value: control.value } } : null;
    };
  }

  _mapToContainers(bucketsBoards: (Bucket | Board)[]): Container[] {
    return bucketsBoards.map((bOrB) => this._mapToContainer(bOrB));
  }

  _mapToContainer(bucketBoard: Bucket | Board): Container {
    if (this._isBoard(bucketBoard)) {
      return {
        type: ContainerType.BOARD,
        id: bucketBoard.boardID,
        name: bucketBoard.name,
      };
    } else {
      return {
        type: ContainerType.BUCKET,
        id: bucketBoard.bucketID,
        name: bucketBoard.name,
      };
    }
  }

  // Default to current board if no source required
  _placeholderContainer() {
    return {
      type: ContainerType.WORKFLOW,
      id: this.board.boardID,
      name: 'CK Workspace',
    };
  }
}
