import { Component, Inject, OnInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl, AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn } from '@angular/forms';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { AiAgent, TeacherAgent, IdeaAgentChat, IdeaAgentAmbient, PersonalLearningAgent, GroupInteractionAgent, WorkflowAgent } from 'src/app/models/ai-agent';
import { AI_AGENT_CONFIG, AiAgentTypeConfig, AiAgentFieldConfig } from 'src/app/models/ai-agent-config'; 
import { WorkflowService } from 'src/app/services/workflow.service'; 
import { Workflow } from 'src/app/models/workflow';
import { BucketService } from 'src/app/services/bucket.service'; 

@Component({
  selector: 'app-configure-ai-agent-modal',
  templateUrl: './configure-ai-agent-modal.component.html',
  styleUrls: ['./configure-ai-agent-modal.component.scss']
})
export class ConfigureAiAgentModalComponent implements OnInit {
  agentForm: FormGroup;
  agentConfig: AiAgentTypeConfig; // Use the new type
  agentInstance: AiAgent;  // Keep this for the name in the title.
  agentType: string;
  workflows: Workflow[] = []; //To store workflows
  sortedFieldConfigs: [string, AiAgentFieldConfig][]; // Array to store sorted fields


  constructor(
    public dialogRef: MatDialogRef<ConfigureAiAgentModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { agentType: string; topic?: string, enabled?: boolean, payloadScope?: string[], boardId: string }, // Add boardId
    private fb: FormBuilder,
    private workflowService: WorkflowService, // Inject WorkflowService
    private bucketService: BucketService, //Inject BucketService
    private zone: NgZone
  ) {}

  async ngOnInit(): Promise<void> {
      // 1. Get agent configuration based on agentType
        this.agentConfig = AI_AGENT_CONFIG[this.data.agentType];
        if (!this.agentConfig) {
            throw new Error(`Invalid agent type: ${this.data.agentType}`);
        }
        this.agentType = this.data.agentType;

        // 2. Create agent instance with appropriate initial data
        let initialData: Partial<AiAgent> = {};
        if (this.data.agentType === 'idea_ambient') {
            initialData = {
                topic: this.data.topic,
                enabled: this.data.enabled,
                payloadScope: this.data.payloadScope
            };
        }
        //Dynamically create agent instance
        switch (this.data.agentType) {
          case 'teacher':
            this.agentInstance = new TeacherAgent(initialData);
            break;
          case 'idea_chat':
              this.agentInstance = new IdeaAgentChat(initialData);
              break;
            case 'idea_ambient':
              this.agentInstance = new IdeaAgentAmbient(initialData);
              break;
            case 'personal_learning':
              this.agentInstance = new PersonalLearningAgent(initialData);
              break;
            case 'group_interaction':
              this.agentInstance = new GroupInteractionAgent(initialData);
              break;
          case 'workflow':
              this.agentInstance = new WorkflowAgent(initialData);
              break;
          default:
              throw new Error(`Invalid agent type: ${this.data.agentType}`);
        }
        //Load Workflows for the workflow agent
        if(this.data.agentType == 'workflow'){
            await this.loadWorkflows();
        }

        //Load buckets for payload scope
        await this.loadBuckets();
        // 3. Sort fields by order
        this.sortedFieldConfigs = Object.entries(this.agentConfig).sort(([, a], [, b]) => a.order - b.order);

        // 4. Create the form
        this.zone.run(() => {
          this.createForm();
       });
    }

    async loadWorkflows() {
        try {
            if(!this.data.boardId) {return;}
            this.workflows = await this.workflowService.getAll(this.data.boardId);

        } catch (error) {
            console.error('Failed to load workflows', error);
          // Optionally handle the error (e.g., display a message to the user)
        }
    }

    async loadBuckets() {
      try {
          if(!this.data.boardId) { return; }
          const buckets = await this.bucketService.getAllByBoard(this.data.boardId);
          // Add buckets to payloadScope options if not already there:
          if (buckets) {
            for (const bucket of buckets) {
              // Check if option already included (by value)
              if (!this.agentConfig.payloadScope.options!.some(option => option.value === bucket.bucketID)) { //the ! tells typescript this won't be undefined
                  this.agentConfig.payloadScope.options!.push({value: bucket.bucketID, label: bucket.name}) // Typescript knows this is the correct shape
              }
            }
          }
        } catch(error) {
            console.error('Failed to load buckets', error);
        }
    }

    createForm() {
    const group: any = {};

    // Iterate over sorted fields
    for (const [fieldName, fieldConfig] of this.sortedFieldConfigs) {
      const syncValidators: ValidatorFn[] = [];
      const asyncValidators: AsyncValidatorFn[] = [];

      if (fieldConfig.required) {
        syncValidators.push(Validators.required);
      }

      let defaultValue = fieldConfig.defaultValue;
      if (defaultValue === undefined) {
          defaultValue = (this.agentInstance as any)[fieldName] !== undefined ? (this.agentInstance as any)[fieldName] : null; // Use instance value or null
      }

      // Add custom validator if it exists
      if (fieldName === 'workflowsToActivate') {
        asyncValidators.push(this.validateWorkflowsBelongToBoard.bind(this));
      }

      group[fieldName] = new FormControl({ value: defaultValue, disabled: !fieldConfig.editable }, syncValidators, asyncValidators);
    }
    this.agentForm = this.fb.group(group);
}



  onNoClick(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.agentForm.valid) {
        const agentData = {
            ...this.agentInstance, //keep fixed
            ...this.agentForm.value,  //form values overwrite
            type: this.agentInstance.type, //keep type
            name: this.agentInstance.name, //keep name
        };
      this.dialogRef.close(agentData);
    }
  }

    getControl(fieldName: string): AbstractControl | null {
        return this.agentForm.get(fieldName);
    }

    // ASYNC Validator:  Must return a Promise or Observable
    async validateWorkflowsBelongToBoard(control: AbstractControl): Promise<ValidationErrors | null> {
    const workflowIDs: string[] = control.value;

    if (!workflowIDs || workflowIDs.length === 0) {
      return null; // No workflows selected, so it's valid
    }
    if(!this.data.boardId)
    {
        return {invalidBoardId: true};
    }

    try {
      const workflows = await this.workflowService.getAll(this.data.boardId);
      const validWorkflowIds = new Set(workflows.map(w => w.workflowID));
      const allValid = workflowIDs.every(id => validWorkflowIds.has(id));

      return allValid ? null : { invalidWorkflowId: true }; // Return error object if invalid.

    } catch (error) {
      console.error("Error in validateWorkflowsBelongToBoard:", error);
      return { apiError: true }; // Indicate an API/network error
    }
  }

    // Helper function to get options, handling both string[] and object[]
    getOptions(fieldName: string): { value: any; label: string }[] {
        const config = this.agentConfig[fieldName];
        if (!config || !config.options) {
            return []; // Return empty array if no options defined
        }
        // Ensure options are *always* in {value, label} format.
        return config.options.map(option => {
            if (typeof option === 'string' || typeof option === 'number' || typeof option === 'boolean') {
                return { value: option, label: String(option) };
            }
            return option;
        });
    }
}