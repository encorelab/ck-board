import { Component, Inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  UntypedFormControl,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialog as MatDialog,
} from '@angular/material/legacy-dialog';
import { MatLegacySnackBarConfig as MatSnackBarConfig } from '@angular/material/legacy-snack-bar';
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
  // Properties
  selected = new UntypedFormControl(0); // Controls which tab is currently selected (0: Buckets, 1: Create, 2: Manage)

  // Data models
  board: Board; // Current board
  buckets: Bucket[]; // All buckets
  boardBuckets: Bucket[]; // Buckets associated with the current board
  workflows: any[] = []; // List of workflows
  tags: Tag[]; // Available tags for the board
  upvoteLimit: number; // Upvote limit for the board
  selectedTag: string; // Selected tag for filtering (if applicable)

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
  distributionDestinations: (Bucket | Board)[] = [];
  postsPerBucket: number;
  distributionWorkflowType: DistributionWorkflowType =
    DistributionWorkflowType.RANDOM;
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

  bucketNameFormControl = new UntypedFormControl('valid', [
    Validators.required,
    this._forbiddenNameValidator(),
  ]);
  workflowNameFormControl = new UntypedFormControl('valid', [Validators.required]);
  sourceFormControl = new UntypedFormControl('valid', [Validators.required]);
  destinationFormControl = new UntypedFormControl('valid', [Validators.required]);

  sourceDestinationMatchError = new UntypedFormControl(false);

  groupsFormControl = new UntypedFormControl('valid', [Validators.required]);
  promptFormControl = new UntypedFormControl('valid', [Validators.required]);

  workflowTypeFormControl = new UntypedFormControl('valid', [Validators.required]);
  removeFromSourceFormControl = new UntypedFormControl('valid', [Validators.required]);

  tagsFormControl = new UntypedFormControl();

  matcher = new MyErrorStateMatcher();
  snackbarConfig: MatSnackBarConfig;

  constructor(
    public dialogRef: MatDialogRef<CreateWorkflowModalComponent>,
    private dialog: MatDialog,
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
    // Initialization
    this.board = this.data.board; // Load the current board from the passed data
    this.tags = this.data.board.tags; // Load tags associated with the board
    this.loadGroups(); // Load groups associated with the project
    this.upvoteLimit = this.data.board.upvoteLimit; // Load the upvote limit for the board
    this.loadBucketsBoards(); // Load buckets and boards for source/destination options
    this.loadWorkflows(); // Load existing workflows for the board
  }

  // Fetches groups for the project
  async loadGroups() {
    this.groupOptions = await this.groupService.getByProjectId(
      this.data.project.projectID
    );
  }

  // Loads buckets and boards, updates source/destination options.
  async loadBucketsBoards(): Promise<void> {
    this.sourceOptions = [];
    this.destOptions = [];
    this.boardBuckets = [];

    try {
      // 1. Fetch Project Boards
      const projectBoards = await this.boardService.getMultipleBy(
        this.data.project.boards,
        {
          scope: BoardScope.PROJECT_SHARED,
        }
      );

      // Add project boards FIRST
      this.destOptions = this.destOptions.concat(projectBoards);
      this.sourceOptions = this.sourceOptions.concat(projectBoards);

      // 2. Fetch Buckets
      const buckets = await this.bucketService.getAllByBoard(
        this.data.board.boardID
      );
      this.boardBuckets = this.boardBuckets.concat(buckets);

      // 3. Add buckets SECOND
      this.sourceOptions = this.sourceOptions.concat(buckets);
      this.destOptions = this.destOptions.concat(buckets);
    } catch (error) {
      console.error('Error loading boards and buckets:', error);
    }
  }

  // Fetches workflows for the board from the workflowService.
  async loadWorkflows(): Promise<void> {
    return this.workflowService.getAll(this.board.boardID).then((workflows) => {
      this.workflows = [];
      workflows.forEach((workflow) => {
        this.workflows.push(workflow);
      });
    });
  }

  // Creates a new bucket and updates UI.
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

  // Toggles visibility of bucket deletion controls.
  toggleDeleteBoard() {
    this.showDelete = !this.showDelete;
  }

  // Opens a confirmation dialog and deletes the bucket.
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

  // Creates a distribution workflow.
  createDistributionWorkflow(): void {
    if (!this._distributionWorkflowTypeSelected()) return;

    const workflow: DistributionWorkflow = this._assembleDistributionWorkflow();
    this.workflowService.createDistribution(workflow).then(async () => {
      await this.loadWorkflows();
      this.selected.setValue(2);
      this._clearWorkflowForm();
    });
  }

  // Creates a peer review workflow.
  createPeerReviewWorkflow(): void {
    if (!this._actionSelected()) return;

    const workflow: TaskWorkflow = this._assemblePeerReviewWorkflow();
    this.workflowService.createTask(workflow).then(async () => {
      await this.loadWorkflows();
      this.selected.setValue(2);
      this._clearWorkflowForm();
    });
  }

  // Creates a generation task workflow.
  createGenerationTaskWorkflow(): void {
    if (!this._validGenerationTaskWorkflow()) return;
    const workflow: TaskWorkflow = this._assembleGenerationTaskWorkflow();
    this.workflowService.createTask(workflow).then(async () => {
      await this.loadWorkflows();
      this.selected.setValue(2);
      this._clearWorkflowForm();
    });
  }

  // Runs the specified workflow (task or distribution).
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

  // Opens a confirmation dialog and deletes the workflow.
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

  // Closes the dialog.
  onNoClick(): void {
    this.dialogRef.close();
  }

  // Displays a snackbar message.
  openSnackBar(message: string): void {
    this.snackbarService.queueSnackbar(message);
  }

  // Resets the workflow creation form.
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

  // Type guard to check if an object is a Board.
  _isBoard(object: Board | Bucket): object is Board {
    return (object as Board).tags !== undefined;
  }

  // Type guard to check if an object is a TaskWorkflow.
  _isTaskWorkflow(
    object: DistributionWorkflow | TaskWorkflow
  ): object is TaskWorkflow {
    return (object as TaskWorkflow).requiredActions !== undefined;
  }

  // Checks if a distribution workflow form is valid.
  _validDistributionWorkflow(): boolean {
    const allowMatch = this.distributionDestinations.length > 1;
    const isMatch =
      this.distributionSource &&
      this.distributionDestinations.some(
        (dest) => dest.name === this.distributionSource.name
      );
    this.sourceDestinationMatchError.setValue(!allowMatch && isMatch);
    return (
      (allowMatch || !isMatch) &&
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
