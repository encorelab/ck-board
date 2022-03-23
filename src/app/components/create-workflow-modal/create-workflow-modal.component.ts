import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBarConfig } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { Board } from 'src/app/models/board';
import Bucket from 'src/app/models/bucket';
import CustomWorkflow, { ContainerType, DistributionWorkflow, WorkflowCriteria, WorkflowType } from 'src/app/models/workflow';
import { BoardService } from 'src/app/services/board.service';
import { BucketService } from 'src/app/services/bucket.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { WorkflowService } from 'src/app/services/workflow.service';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';


@Component({
  selector: 'app-create-workflow-modal',
  templateUrl: './create-workflow-modal.component.html',
  styleUrls: ['./create-workflow-modal.component.scss']
})
export class CreateWorkflowModalComponent implements OnInit, OnDestroy {
  selected = new FormControl(0);

  board: Board
  buckets: Bucket[]
  workflows: any[] = []
  tags: string[]

  WorkflowType: typeof WorkflowType = WorkflowType
  workflowType: WorkflowType = WorkflowType.DISTRIBUTION

  bucketName: string = ''
  workflowName: string = ''

  sourceOptions: any[] = []
  destOptions: any[] = []

  source: Board | Bucket
  distributionDestinations: any[]
  customDestination: Board | Bucket

  activateImmediately: boolean = true
  includeExistingPosts: boolean = false

  includeLikes: boolean = false
  includeComments: boolean = false
  includeTags: boolean = false

  selectedLikes: number | null
  selectedComments: number | null
  selectedTags: string[] | null
 
  postsPerBucket: number

  bucketNameFormControl = new FormControl('valid', [Validators.required, this._forbiddenNameValidator()])
  workflowNameFormControl = new FormControl('valid', [Validators.required])
  sourceFormControl = new FormControl('valid', [Validators.required])
  destinationFormControl = new FormControl('valid', [Validators.required])
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
    @Inject(MAT_DIALOG_DATA) public data: any) { 
      this.snackbarConfig = new MatSnackBarConfig();
      this.snackbarConfig.duration = 5000;
    }

  ngOnInit(): void {
    this.board = this.data.board
    this.tags = this.data.board.tags
    this.loadBucketsBoards();
    this.loadWorkflows()
    this.tagsFormSubscription = this.tagsFormControl.valueChanges.subscribe((value) => this.selectedTags = value)
  }

  async loadBucketsBoards() {
    this.sourceOptions = [];
    this.destOptions = [];

    this.bucketService.getAllByBoard(this.data.board.boardID).then((buckets) => {
      this.sourceOptions = this.sourceOptions.concat(buckets);
      this.destOptions = this.destOptions.concat(buckets);
      this.sourceOptions.push(this.board);
    })
    this.boardService.getMultiple(this.data.project.boards).then(data => {
      data.forEach(obj => {
        let board: Board = obj.data();
        if (board.boardID != this.board.boardID)
          this.destOptions.push(board);
      })
    })
  }

  async loadWorkflows() {
    return this.workflowService.get(this.board.boardID).then((workflows) => {
      this.workflows = []
      workflows.forEach(workflow => {
        this.workflows.push(workflow.data())
      })
    })
  } 

  createBucket() {
    const bucket: Bucket = {
      bucketID: Date.now() + '-' + this.data.board.boardID,
      boardID: this.data.board.boardID,
      name: this.bucketName,
      posts: [],
      timestamp: new Date().getTime()
    }
    
    this.bucketService.create(bucket).then(() => {
      this.loadBucketsBoards();
      this.openSnackBar('Bucket created succesfully!');
      this.bucketNameFormControl.reset();
    });
  }

  createWorkflow() {
    let workflow: any;

    if (this.workflowType == WorkflowType.DISTRIBUTION && this._ppbSelected()) {
      workflow = this._assembleDistributionWorkflow();
    } else if (this.workflowType == WorkflowType.CUSTOM && this._criteriaSelected()) {
      workflow = this._assembleCustomWorkflow();
    } else {
      return;
    }

    this.workflowService.create(workflow).then(async () => {
      await this.loadWorkflows();
      this.selected.setValue(2);
    })
  }

  runWorkflow(e, workflow: any) {
    e.stopPropagation();

    this.workflowService.updateStatus(workflow.workflowID, true).then(() => {
      workflow.active = true;
      this.workflowService.runDistribution(workflow).then(async () => {
        this.workflowService.updateStatus(workflow.workflowID, false);
        workflow.active = false;
        this.openSnackBar('Workflow completed successfully!')
      });
    })
  }

  deleteWorkflow(e, workflow) {
    e.stopPropagation();
    
    this.workflowService.remove(workflow.workflowID).then(() => {
      this.workflows = this.workflows.filter(w => w.workflowID !== workflow.workflowID)
    })
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  openSnackBar(message: string) {
    this.snackbarService.queueSnackbar(message, undefined, {
      matSnackbarConfig: this.snackbarConfig
    });
  }

  ngOnDestroy(): void {
    this.tagsFormSubscription.unsubscribe();
  }

  _isBoard(object: Board | Bucket): object is Board {
    return (object as Board).tags !== undefined;
  }

  _validForm() {
    return this._validCustomWorkflow() || this._validDistributionWorkflow();
  }

  _validDistributionWorkflow() {
    return this.workflowNameFormControl.valid && this.sourceFormControl.valid 
    && this.destinationFormControl.valid && this._ppbSelected();
  }

  _validCustomWorkflow() {
    return this.workflowNameFormControl.valid && this.sourceFormControl.valid 
      && this.destinationFormControl.valid && this.tagsFormControl.valid
      && this._criteriaSelected();
  }

  _criteriaSelected() {
    return (this.includeLikes && this.selectedLikes && isFinite(this.selectedLikes)) 
      || (this.includeComments && this.selectedComments && isFinite(this.selectedComments)) 
      || (this.includeTags && this.selectedTags && this.selectedTags.length > 0)
  }

  _ppbSelected() {
    return this.postsPerBucket && this.postsPerBucket > 0
  }

  _assembleDistributionWorkflow() {
    let workflowID: string = new Date().getTime() + this.board.boardID;

    let workflow: DistributionWorkflow = {
      workflowID: workflowID,
      boardID: this.board.boardID,
      active: false,
      name: this.workflowName,
      source: this._mapToContainer(this.source),
      destinations: this._mapToContainers(this.distributionDestinations),
      postsPerBucket: this.postsPerBucket,
      timestamp: new Date().getTime()
    }

    return workflow;
  }

  _assembleCustomWorkflow() {
    let workflowID: string = new Date().getTime() + this.board.boardID;
    
    let workflow: CustomWorkflow = {
      workflowID: workflowID,
      boardID: this.board.boardID,
      active: false,
      name: this.workflowName,
      source: this._mapToContainer(this.source),
      destination: this._mapToContainer(this.customDestination),
      criteria: this._assembleCriteria(workflowID),
      timestamp: new Date().getTime()
    }

    return workflow;
  }

  _assembleCriteria(workflowID: string) {
    let criteria: WorkflowCriteria = {
      criteriaID: new Date().getTime() + this.board.boardID,
      workflowID: workflowID,
      minimumLikes: this.includeLikes ? this.selectedLikes : null,
      minimumComments: this.includeComments ? this.selectedComments : null,
      includesTags: this.includeTags ? this.selectedTags : null
    }

    return criteria;
  }

  _parseNames(workflows) {
    return workflows.map(a => a.name).join(', ');
  }

  _validBucketForm() {
    return this.bucketNameFormControl.valid;
  }

  _forbiddenNameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const forbidden = this.board ? control.value == this.board.name : false;
      return forbidden ? {forbidden: {value: control.value}} : null; 
    };
  }

  _mapToContainers(bucketsBoards: (Bucket | Board)[]) {
    return bucketsBoards.map(bOrB => this._mapToContainer(bOrB));
  }

  _mapToContainer(bucketBoard: Bucket | Board) {
    if (this._isBoard(bucketBoard)) {
      return { type: ContainerType.BOARD, id: bucketBoard.boardID, name: bucketBoard.name };
    } else {
      return { type: ContainerType.BUCKET, id: bucketBoard.bucketID, name: bucketBoard.name };
    }
  }
}
