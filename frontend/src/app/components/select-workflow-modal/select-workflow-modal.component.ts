import { Component, Inject, OnInit } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { WorkflowService } from 'src/app/services/workflow.service';
import { Workflow } from 'src/app/models/workflow'; // Import the Workflow interface

@Component({
  selector: 'app-select-workflow-modal',
  templateUrl: './select-workflow-modal.component.html',
  styleUrls: ['./select-workflow-modal.component.scss']
})
export class SelectWorkflowModalComponent implements OnInit {

  workflows: Workflow[] = []; // Use the Workflow interface
  selectedWorkflowId: string | null = null; // Allow null for no selection

  constructor(
    public dialogRef: MatDialogRef<SelectWorkflowModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { boardID: string }, // Simplify data
    private workflowService: WorkflowService,
  ) {}

  ngOnInit(): void {
    this.loadWorkflows();
  }

  async loadWorkflows() {
    if (this.data.boardID) {
      try {
        this.workflows = await this.workflowService.getAll(this.data.boardID);
      } catch (error) {
        console.error('Error loading workflows:', error);
        // Handle error (e.g., display an error message to the user)
      }
    }
  }

  onNoClick(): void {
    this.dialogRef.close(null); // Explicitly close with null (consistent with CustomTeacherPromptModalComponent)
  }

  onSelect(): void {
      this.dialogRef.close(this.selectedWorkflowId); //  Close with the selected ID (or null)
  }

  openCreateWorkflowModal() {
    // Close the current dialog (SelectWorkflowModalComponent)
    this.dialogRef.close({ shouldOpenCreateModal: true });
  }
}