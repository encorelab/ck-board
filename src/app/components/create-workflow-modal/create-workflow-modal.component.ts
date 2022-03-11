import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Board } from 'src/app/models/board';
import Bucket from 'src/app/models/bucket';
import CustomWorkflow, { DistributionWorkflow, WorkflowCriteria, WorkflowType } from 'src/app/models/workflow';
import { BucketService } from 'src/app/services/bucket.service';
import { WorkflowService } from 'src/app/services/workflow.service';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';


@Component({
  selector: 'app-create-workflow-modal',
  templateUrl: './create-workflow-modal.component.html',
  styleUrls: ['./create-workflow-modal.component.scss']
})
export class CreateWorkflowModalComponent implements OnInit {
  selected = new FormControl(0);

  board: Board
  buckets: Bucket[]
  workflows: any[] = []
  tags: string[]

  WorkflowType: typeof WorkflowType = WorkflowType
  workflowType: WorkflowType = WorkflowType.DISTRIBUTION

  bucketName: string = ''
  workflowName: string = ''

  sourceDestOptions: any[] = []

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

  workflowNameFormControl = new FormControl('valid', [Validators.required])
  sourceFormControl = new FormControl('valid', [Validators.required])
  destinationFormControl = new FormControl('valid', [Validators.required])
  tagsFormControl = new FormControl();

  matcher = new MyErrorStateMatcher();
  
  constructor(
    public dialogRef: MatDialogRef<CreateWorkflowModalComponent>,
    public bucketService: BucketService,
    public workflowService: WorkflowService,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
    this.board = this.data.board
    this.tags = this.data.board.tags
    this.bucketService.getAllByBoard(this.data.board.boardID).then((buckets) => {
      this.sourceDestOptions = this.sourceDestOptions.concat(buckets)
      this.sourceDestOptions.push(this.board)
    })
    this.loadWorkflows()
    this.tagsFormControl.valueChanges.subscribe((value) => this.selectedTags = value)
  }

  loadWorkflows() {
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
    
    this.bucketService.create(bucket)
    this.dialogRef.close();
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

    this.workflowService.create(workflow).then(() => this.loadWorkflows().then(() => this.selected.setValue(2)))
  }

  toggleWorkflow(current: boolean, workflowID: string) {
    this.workflowService.updateStatus(workflowID, true).then(() => {
      this.workflows.forEach((workflow) => {
        if (workflow.workflowID == workflowID) {
          workflow.active = true;
          this.workflowService.runDistribution(workflow).then(() => {
            this.workflowService.updateStatus(workflowID, false);
            workflow.active = false;
          });
        }
      })
    })
  }

  deleteWorkflow(workflowID: string) {
    this.workflowService.remove(workflowID).then(() => {
      this.workflows = this.workflows.filter(workflow => workflow.workflowID !== workflowID)
    })
  }

  onNoClick(): void {
    this.dialogRef.close();
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
      source: this.source,
      destinations: this.distributionDestinations,
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
      source: this.source,
      destination: this.customDestination,
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
}
