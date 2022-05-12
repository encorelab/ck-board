import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBarConfig } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { Board } from 'src/app/models/board';
import Bucket from 'src/app/models/bucket';
import Workflow, { DestinationType } from 'src/app/models/workflow';
import { BoardService } from 'src/app/services/board.service';
import { BucketService } from 'src/app/services/bucket.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { WorkflowService } from 'src/app/services/workflow.service';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';

@Component({
  selector: 'app-create-workflow-modal',
  templateUrl: './create-workflow-modal.component.html',
  styleUrls: ['./create-workflow-modal.component.scss'],
})
export class CreateWorkflowModalComponent implements OnInit, OnDestroy {
  selected = new FormControl(0);

  board: Board;
  buckets: Bucket[];
  workflows: any[] = [];
  tags: string[];

  bucketName: string = '';
  workflowName: string = '';

  sourceOptions: any[] = [];
  destOptions: any[] = [];

  source: Board | Bucket;
  distributionDestinations: any[];
  customDestination: Board | Bucket;

  postsPerBucket: number;

  bucketNameFormControl = new FormControl('valid', [
    Validators.required,
    this._forbiddenNameValidator(),
  ]);
  workflowNameFormControl = new FormControl('valid', [Validators.required]);
  sourceFormControl = new FormControl('valid', [Validators.required]);
  destinationFormControl = new FormControl('valid', [Validators.required]);
  tagsFormControl = new FormControl();
  tagsFormSubscription: Subscription;

  matcher = new MyErrorStateMatcher();
  snackbarConfig: MatSnackBarConfig;

  constructor(
    public dialogRef: MatDialogRef<CreateWorkflowModalComponent>,
    private snackbarService: SnackbarService,
    public bucketService: BucketService,
    public boardService: BoardService,
    public workflowService: WorkflowService,
    public canvasService: CanvasService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.snackbarConfig = new MatSnackBarConfig();
    this.snackbarConfig.duration = 5000;
  }

  ngOnInit(): void {
    this.board = this.data.board;
    this.tags = this.data.board.tags;
    this.loadBucketsBoards();
    this.loadWorkflows();
  }

  async loadBucketsBoards() {
    this.sourceOptions = [];
    this.destOptions = [];

    this.bucketService
      .getAllByBoard(this.data.board.boardID)
      .then((buckets) => {
        this.sourceOptions = this.sourceOptions.concat(buckets);
        this.destOptions = this.destOptions.concat(buckets);
        this.sourceOptions.push(this.board);
      });
    this.boardService.getMultiple(this.data.project.boards).then((data) => {
      data.forEach((board: Board) => {
        if (board.boardID != this.board.boardID) this.destOptions.push(board);
      });
    });
  }

  async loadWorkflows() {
    return this.workflowService.get(this.board.boardID).then((workflows) => {
      this.workflows = [];
      workflows.forEach((workflow) => {
        this.workflows.push(workflow);
      });
    });
  }

  createBucket() {
    const bucket: Bucket = {
      bucketID: Date.now() + '-' + this.data.board.boardID,
      boardID: this.data.board.boardID,
      name: this.bucketName,
      posts: [],
      timestamp: new Date().getTime(),
    };

    this.bucketService.create(bucket).then(() => {
      this.loadBucketsBoards();
      this.openSnackBar('Bucket: ' + bucket.name + ' created succesfully!');
      this.bucketNameFormControl.reset();
    });
  }

  createWorkflow() {
    let workflow: any;

    if (this._ppbSelected()) {
      workflow = this._assembleWorkflow();
    } else {
      return;
    }

    this.workflowService.create(workflow).then(async () => {
      await this.loadWorkflows();
      this.selected.setValue(2);
    });
  }

  runWorkflow(e, workflow: any) {
    e.stopPropagation();

    this.workflowService
      .update(workflow.workflowID, { active: true })
      .then(() => {
        workflow.active = true;
        this.canvasService.runWorkflow(workflow).then(async () => {
          workflow.active = false;
          this.openSnackBar(
            'Workflow: ' + workflow.name + ' completed successfully!'
          );
        });
      });
  }

  deleteWorkflow(e, workflow) {
    e.stopPropagation();

    this.workflowService.remove(workflow.workflowID).then(() => {
      this.workflows = this.workflows.filter(
        (w) => w.workflowID !== workflow.workflowID
      );
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  openSnackBar(message: string) {
    this.snackbarService.queueSnackbar(message);
  }

  ngOnDestroy(): void {
    this.tagsFormSubscription.unsubscribe();
  }

  _isBoard(object: Board | Bucket): object is Board {
    return (object as Board).tags !== undefined;
  }

  _validForm() {
    return this._validWorkflow();
  }

  _validWorkflow() {
    return (
      this.workflowNameFormControl.valid &&
      this.sourceFormControl.valid &&
      this.destinationFormControl.valid &&
      this._ppbSelected()
    );
  }

  _ppbSelected() {
    return this.postsPerBucket && this.postsPerBucket > 0;
  }

  _assembleWorkflow() {
    let workflowID: string = new Date().getTime() + this.board.boardID;

    let workflow: Workflow = {
      workflowID: workflowID,
      boardID: this.board.boardID,
      active: false,
      name: this.workflowName,
      source: this._mapToContainer(this.source),
      destinations: this._mapToContainers(this.distributionDestinations),
      postsPerDestination: this.postsPerBucket,
    };

    return workflow;
  }

  _validBucketForm() {
    return this.bucketNameFormControl.valid;
  }

  _forbiddenNameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const forbidden = this.board ? control.value == this.board.name : false;
      return forbidden ? { forbidden: { value: control.value } } : null;
    };
  }

  _mapToContainers(bucketsBoards: (Bucket | Board)[]) {
    return bucketsBoards.map((bOrB) => this._mapToContainer(bOrB));
  }

  _mapToContainer(bucketBoard: Bucket | Board) {
    if (this._isBoard(bucketBoard)) {
      return {
        type: DestinationType.BOARD,
        id: bucketBoard.boardID,
        name: bucketBoard.name,
      };
    } else {
      return {
        type: DestinationType.BUCKET,
        id: bucketBoard.bucketID,
        name: bucketBoard.name,
      };
    }
  }
}
