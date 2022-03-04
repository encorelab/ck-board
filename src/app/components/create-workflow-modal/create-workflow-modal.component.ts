import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Board } from 'src/app/models/board';
import Bucket from 'src/app/models/bucket';
import Workflow, { WorkflowCriteria } from 'src/app/models/workflow';
import { BucketService } from 'src/app/services/bucket.service';
import { WorkflowService } from 'src/app/services/workflow.service';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';

@Component({
  selector: 'app-create-workflow-modal',
  templateUrl: './create-workflow-modal.component.html',
  styleUrls: ['./create-workflow-modal.component.scss']
})
export class CreateWorkflowModalComponent implements OnInit {

  tagsFormControl = new FormControl();

  board: Board
  buckets: Bucket[]
  workflows: Workflow[] = []
  tags: string[]

  bucketName: string = ''
  workflowName: string = ''

  sourceDestOptions: any[] = []

  source: Board | Bucket
  destination: Board | Bucket

  activateImmediately: boolean = true
  includeExistingPosts: boolean = false
  includeLikes: boolean = false
  includeComments: boolean = false
  includeTags: boolean = false

  selectedLikes: number | null
  selectedComments: number | null
  selectedTags: string[] | null
 
  workflowNameFormControl = new FormControl('valid', [Validators.required])
  sourceFormControl = new FormControl('valid', [Validators.required])
  destinationFormControl = new FormControl('valid', [Validators.required])

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
    this.workflowService.get(this.board.boardID).then((workflows) => {
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
    if (!this._criteriaSelected()) {
      console.log(this.includeLikes)
      return
    }

    const workflowID = new Date().getTime() + this.board.boardID

    let criteria: WorkflowCriteria = {
      criteriaID: new Date().getTime() + this.board.boardID,
      workflowID: workflowID,
      minimumLikes: this.includeLikes ? this.selectedLikes : null,
      minimumComments: this.includeComments ? this.selectedComments : null,
      includesTags: this.includeTags ? this.selectedTags : null
    }

    let workflow: Workflow = {
      workflowID: workflowID,
      boardID: this.board.boardID,
      active: this.activateImmediately,
      name: this.workflowName,
      source: this.source,
      destination: this.destination,
      criteria: criteria,
      timestamp: new Date().getTime()
    }
    
    this.workflowService.create(workflow).then(() => this.dialogRef.close())
  }

  toggleWorkflow(current: boolean, workflowID: string) {
    this.workflowService.updateStatus(workflowID, !current).then(() => {
      this.workflows.forEach((workflow) => {
        if (workflow.workflowID == workflowID) {
          workflow.active = !current
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
    return this.workflowNameFormControl.valid && this.sourceFormControl.valid 
      && this.destinationFormControl.valid && this.tagsFormControl.valid
      && this._criteriaSelected()
  }

  _criteriaSelected() {
    return (this.includeLikes && this.selectedLikes && isFinite(this.selectedLikes)) 
      || (this.includeComments && this.selectedComments && isFinite(this.selectedComments)) 
      || (this.includeTags && this.selectedTags && this.selectedTags.length > 0)
  }
}
