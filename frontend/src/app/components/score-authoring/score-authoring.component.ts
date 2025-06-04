// score-authoring.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { ComponentType } from '@angular/cdk/portal';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Project } from 'src/app/models/project';
import { AuthUser } from 'src/app/models/user';
import { Group } from 'src/app/models/group';
import { GroupService } from 'src/app/services/group.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { UserService } from 'src/app/services/user.service';
import { SocketService } from 'src/app/services/socket.service';
import { ProjectService } from 'src/app/services/project.service';
import { BoardService } from 'src/app/services/board.service';
import { Subscription } from 'rxjs';
import { CreateActivityModalComponent } from '../create-activity-modal/create-activity-modal.component';
import { EditActivityModalComponent } from '../edit-activity-modal/edit-activity-modal.component';
import { SelectWorkflowModalComponent } from '../select-workflow-modal/select-workflow-modal.component';
import { ConfigureAiAgentModalComponent } from '../configure-ai-agent-modal/configure-ai-agent-modal.component';
import { CustomTeacherPromptModalComponent } from '../custom-teacher-prompt-modal/custom-teacher-prompt-modal.component';
import { ManageGroupModalComponent } from '../groups/manage-group-modal/manage-group-modal.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // Import HttpErrorResponse
import { Activity } from 'src/app/models/activity'; // Ensure Activity model has isActive?: boolean;
import { generateUniqueID } from 'src/app/utils/Utils';
import { Resource } from 'src/app/models/resource';
import { TeacherTask } from 'src/app/models/teacherTask';
import { fabric } from 'fabric';
import { HostListener } from '@angular/core';
import { ScoreViewModalComponent } from '../score-view-modal/score-view-modal.component';
import { Board } from 'src/app/models/board';
import { ConfigurationModalComponent } from '../configuration-modal/configuration-modal.component';
import { CreateWorkflowModalComponent } from '../create-workflow-modal/create-workflow-modal.component';
import { BucketService } from 'src/app/services/bucket.service';
import { WorkflowService } from 'src/app/services/workflow.service';
import { ShowJoinCodeComponent } from '../show-join-code/show-join-code.component';
import {
  AiAgent,
  TeacherAgent,
  IdeaAgentChat,
  IdeaAgentAmbient,
  PersonalLearningAgent,
  GroupInteractionAgent,
  WorkflowAgent,
} from 'src/app/models/ai-agent';
import { SocketEvent } from 'src/app/utils/constants';

@Component({
  selector: 'app-score-authoring',
  templateUrl: './score-authoring.component.html',
  styleUrls: ['./score-authoring.component.scss'],
})
export class ScoreAuthoringComponent implements OnInit, OnDestroy {
  @ViewChild('editWorkflowsButton') editWorkflowsButton!: ElementRef;
  workflowMap: Map<string, string> = new Map();

  project!: Project;
  user!: AuthUser;
  listeners: Subscription[] = [];

  activities: Activity[] = [];
  selectedActivity: Activity | null = null;
  selectedActivityResources: Resource[] = [];
  selectedActivityGroups: Group[] = [];
  selectedBoardName = '';
  canvas: fabric.Canvas | undefined;
  bucketCount: number = 0;
  workflowCount: number = 0;
  selectedTabIndex: number = 0;

  allAvailableResources: any[] = [
    { name: 'Canvas', type: 'canvas' },
    { name: 'Bucket View', type: 'bucketView' },
    { name: 'Workspace', type: 'workspace' },
    { name: 'Monitor', type: 'monitor' },
    { name: 'Idea Agent', type: 'ideaAgent' },
  ];
  availableResources: any[] = [...this.allAvailableResources];
  availableClassroomObjects: any[] = [
    { name: 'Table', type: 'table', icon: 'table_restaurant' },
    { name: 'Projector', type: 'projector', icon: 'videocam' },
    { name: 'Student', type: 'student', icon: 'person' },
    { name: 'Student Group', type: 'studentGroup', icon: 'groups' },
    { name: 'Teacher', type: 'teacher', icon: 'school' },
  ];
  availableTeacherActions: any[] = [
    { name: 'Activate Workflow', type: 'activateWorkflow', icon: 'timeline' },
    { name: 'Activate AI Agent', type: 'activateAiAgent', icon: 'smart_toy' },
    {
      name: 'Manually Regroup Students',
      type: 'regroupStudents',
      icon: 'group_work',
    },
    { name: 'View Canvas', type: 'viewCanvas', icon: 'visibility' },
    { name: 'View Buckets', type: 'viewBuckets', icon: 'view_module' },
    {
      name: 'View All Tasks, TODOs, & Analytics',
      type: 'viewTodos',
      icon: 'assignment',
    },
    {
      name: 'View Personal Workspace',
      type: 'viewWorkspace',
      icon: 'monitoring',
    },
    {
      name: 'Custom Teacher Prompt',
      type: 'customPrompt',
      icon: 'chat_bubble',
    },
    { name: 'Show Student Join Code', type: 'showJoinCode', icon: 'qr_code' },
  ];
  availableAiAgents: any[] = [
    { name: 'Teacher Agent', type: 'teacher', class: TeacherAgent },
    { name: 'Idea Agent', type: 'idea', class: IdeaAgentChat },
    {
      name: 'Personal Learning Agent',
      type: 'personal_learning',
      class: PersonalLearningAgent,
    },
    {
      name: 'Group Interaction Agent',
      type: 'group_interaction',
      class: GroupInteractionAgent,
    },
    { name: 'Workflow Agent', type: 'workflow', class: WorkflowAgent },
  ];
  teacherTasks: any[] = [];
  activeAiAgents: AiAgent[] = [];
  showResourcesPane = false;
  showClassroomBindings = false;

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (this.showClassroomBindings) {
      this.canvas?.dispose();
      this.canvas = undefined;
      this.initializeCanvas();
    }
  }

  constructor(
    public userService: UserService,
    public snackbarService: SnackbarService,
    public socketService: SocketService,
    private projectService: ProjectService,
    private boardService: BoardService,
    private groupService: GroupService,
    private bucketService: BucketService,
    private workflowService: WorkflowService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public dialog: MatDialog,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.user = this.userService.user!;
    this.loadScoreAuthoringData();
  }

  initializeCanvas() {
    const canvasContainer =
      document.getElementById('classroomCanvas')?.parentElement;
    if (canvasContainer) {
      this.canvas = new fabric.Canvas('classroomCanvas', {
        width: canvasContainer.offsetWidth,
        height: canvasContainer.offsetHeight,
      });
      this.createDotGrid();
      this.drawInnerBox();
      this.canvas.on('object:added', this.onObjectAdded.bind(this));
      this.canvas.on('object:moving', this.onObjectMoving.bind(this));
    }
  }
  createDotGrid() {
    /* ... */
  }
  drawInnerBox() {
    /* ... */
  }
  onObjectAdded(event: any) {
    /* ... */
  }
  onObjectMoving(event: any) {
    /* ... */
  }

  async loadScoreAuthoringData(): Promise<void> {
    const projectID = this.activatedRoute.snapshot.paramMap.get('projectID');
    if (!projectID) {
      this.router.navigate(['error']);
      return;
    }

    try {
      this.project = await this.projectService.get(projectID);
    } catch (error) {
      this.snackbarService.queueSnackbar('Error loading project data.');
      this.router.navigate(['error']);
      return;
    }

    try {
      this.activities =
        (await this.http
          .get<Activity[]>(`activities/project/${projectID}`)
          .toPromise()) || [];
      this.activities.sort((a, b) => a.order - b.order);

      // Determine active activity based on its own isActive flag
      // The backend PUT /api/activities/:id ensures only one is active per project
      const activeActivity = this.activities.find(
        (act) => act.isActive === true
      );

      if (this.activities.length > 0) {
        this.selectActivity(activeActivity || this.activities[0]); // Select active or first
      } else {
        this.selectActivity(null);
      }
    } catch (error) {
      this.snackbarService.queueSnackbar('Error loading activities list.');
      console.error('Error loading activities list:', error);
    }
  }

  async selectActivity(activity: Activity | null) {
    if (!activity) {
      this.selectedActivity = null;
      this.selectedActivityResources = [];
      this.selectedActivityGroups = [];
      this.selectedBoardName = '';
      this.teacherTasks = [];
      this.activeAiAgents = [];
      this.bucketCount = 0;
      this.workflowCount = 0;
      this.cdr.detectChanges();
      return;
    }
    this.selectedActivity = activity; // The activity object from the list already has its isActive status
    this.showResourcesPane = false;
    try {
      this.selectedActivityResources =
        (await this.http
          .get<Resource[]>(`resources/activity/${activity.activityID}`)
          .toPromise()) || [];
      this.selectedActivityResources.sort((a, b) => a.order - b.order);
      this.selectedBoardName = await this.getSelectedBoardName();
      await this.loadActiveAiAgents();
      this.fetchActivityGroups(activity.groupIDs);
      this.loadTeacherTasks();
      this.updateBucketAndWorkflowCounts(); // Ensure this is still needed and services are injected
      this.filterAvailableResources();
    } catch (error) {
      this.snackbarService.queueSnackbar('Error fetching activity details.');
    }
    this.cdr.detectChanges();
  }

  async toggleActivityState(activity: Activity, event: MouseEvent) {
    event.stopPropagation();
    if (activity.isActive) {
      await this.stopActivity(activity);
    } else {
      await this.startActivity(activity);
    }
  }

  async startActivity(activityToStart: Activity) {
    if (!this.project) return;

    try {
      // The backend PUT will handle deactivating other activities
      const updatedStartedActivity = await this.http
        .put<Activity>(`activities/${activityToStart.activityID}`, {
          ...activityToStart,
          isActive: true,
        })
        .toPromise();

      if (!updatedStartedActivity) {
        throw new Error('Failed to update activity to active on the server.');
      }

      // Update local activities array
      this.activities.forEach((act) => {
        act.isActive = act.activityID === updatedStartedActivity.activityID;
      });
      // If selectedActivity is not the one we just started, update it
      if (
        this.selectedActivity?.activityID !== updatedStartedActivity.activityID
      ) {
        this.selectedActivity = updatedStartedActivity;
      } else if (this.selectedActivity) {
        // If it was already selected, ensure its isActive is updated
        this.selectedActivity.isActive = true;
      }

      // Fetch fresh resources for the activity being started for the socket message
      const resourcesForSocket =
        (await this.http
          .get<Resource[]>(`resources/activity/${activityToStart.activityID}`)
          .toPromise()) || [];
      resourcesForSocket.sort((a, b) => a.order - b.order);

      const socketPayload = {
        eventData: {
          // Ensure payload is wrapped in eventData if roomcasting expects it
          projectID: this.project.projectID,
          activityID: activityToStart.activityID,
          boardID: activityToStart.boardID,
          resources: resourcesForSocket, // These are the resources for the activity being started
        },
      };
      console.log(
        'SCORE Authoring: Attempting to emit RESOURCES_UPDATE with payload:',
        JSON.stringify(socketPayload, null, 2)
      );

      this.socketService.emit(SocketEvent.RESOURCES_UPDATE, socketPayload);

      console.log('SCORE Authoring: SocketEvent.RESOURCES_UPDATE emitted.');

      this.snackbarService.queueSnackbar(
        `Activity "${activityToStart.name}" started.`
      );
      // No need to call selectActivity if it's already selected and its isActive status is updated.
      // If it wasn't selected, the above logic handles it.
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error starting activity:', error);
      this.snackbarService.queueSnackbar('Failed to start activity.');
      // Revert UI if necessary (though backend should be source of truth on next load)
      const localActivity = this.activities.find(
        (a) => a.activityID === activityToStart.activityID
      );
      if (localActivity) localActivity.isActive = false;
      this.cdr.detectChanges();
    }
  }

  async stopActivity(activityToStop: Activity) {
    if (!this.project) return;

    try {
      const updatedStoppedActivity = await this.http
        .put<Activity>(`activities/${activityToStop.activityID}`, {
          ...activityToStop,
          isActive: false,
        })
        .toPromise();

      if (!updatedStoppedActivity) {
        throw new Error('Failed to update activity to inactive on the server.');
      }

      // Update local activity
      const localActivity = this.activities.find(
        (a) => a.activityID === updatedStoppedActivity.activityID
      );
      if (localActivity) {
        localActivity.isActive = false;
      }
      if (
        this.selectedActivity?.activityID === updatedStoppedActivity.activityID
      ) {
        this.selectedActivity.isActive = false;
      }

      this.socketService.emit(SocketEvent.ACTIVITY_STOPPED, {
        eventData: {
          projectID: this.project.projectID,
          activityID: activityToStop.activityID,
        },
      });
      this.snackbarService.queueSnackbar(
        `Activity "${activityToStop.name}" stopped.`
      );
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error stopping activity:', error);
      this.snackbarService.queueSnackbar('Failed to stop activity.');
      // Revert UI if necessary
      const localActivity = this.activities.find(
        (a) => a.activityID === activityToStop.activityID
      );
      if (localActivity) localActivity.isActive = true; // Revert optimistic update
      this.cdr.detectChanges();
    }
  }

  async loadActiveAiAgents() {
    if (!this.selectedActivity) {
      return;
    }
    try {
      this.activeAiAgents =
        (await this.http
          .get<AiAgent[]>(
            `ai-agents/activity/${this.selectedActivity.activityID}`
          )
          .toPromise()) || [];
      this.activeAiAgents.sort((a, b) => a.order - b.order); //sort by order
    } catch (error) {
      this.snackbarService.queueSnackbar('Error loading active AI agents.');
      console.error('Error loading active AI agents:', error);
    }
  }

  async dropAiAgentFromAvailable(event: CdkDragDrop<any[]>) {
    const agentType = this.availableAiAgents[event.previousIndex].type;
    const agentClass = this.availableAiAgents[event.previousIndex].class;
    // Open configuration modal *before* creating in the database
    let newAgentData: Partial<AiAgent> = { type: agentType }; //for idea agents
    if (agentType === 'idea') {
      const ideaAgentDialogRef = this.dialog.open(
        ConfigureAiAgentModalComponent,
        {
          width: '800px',
          height: '600px',
          data: { agentType: 'idea_chat', agentClass: IdeaAgentChat },
        }
      );
      const ideaChatResult = await ideaAgentDialogRef.afterClosed().toPromise();

      if (!ideaChatResult) {
        //if cancelled, don't make any agents
        return;
      }
      const ideaAgentAmbientDialogRef = this.dialog.open(
        ConfigureAiAgentModalComponent,
        {
          width: '600px',
          data: {
            agentType: 'idea_ambient',
            agentClass: IdeaAgentAmbient,
            topic: ideaChatResult.topic,
            enabled: ideaChatResult.enabled,
            payloadScope: ideaChatResult.payloadScope,
          },
        }
      );
      const ideaAmbientResult = await ideaAgentAmbientDialogRef
        .afterClosed()
        .toPromise();
      if (!ideaAmbientResult) {
        //if cancelled, don't make any agents
        return;
      }
      //Create and add both agents
      await this.createAndAddAiAgent(ideaChatResult);
      await this.createAndAddAiAgent(ideaAmbientResult);
    } else {
      const dialogRef = this.dialog.open(ConfigureAiAgentModalComponent, {
        width: '600px',
        data: { agentType, agentClass: agentClass },
      });

      const result = await dialogRef.afterClosed().toPromise();

      if (result) {
        // Create the agent in the database and add to the active list
        newAgentData = result;
        await this.createAndAddAiAgent(newAgentData);
      }
    }
  }
  async createAndAddAiAgent(agentData: Partial<AiAgent>) {
    if (!this.selectedActivity) {
      console.error('No selected activity!');
      return;
    }
    try {
      const newAgentData: Partial<AiAgent> = {
        ...agentData, //get the agent data from the modal
        aiAgentID: generateUniqueID(), // Generate a unique ID
        activityID: this.selectedActivity.activityID, // Set the activity ID
        order: this.activeAiAgents.length + 1,
      };

      const newAgent = await this.http
        .post<AiAgent>('ai-agents/', newAgentData)
        .toPromise();
      if (newAgent) {
        //check agent created
        this.activeAiAgents.push(newAgent);

        this.selectedTabIndex = 1;
      }
    } catch (error) {
      this.snackbarService.queueSnackbar('Error creating AI agent.');
      console.error('Error creating AI agent:', error);
    }
  }

  dropAiAgent(event: CdkDragDrop<AiAgent[]>) {
    moveItemInArray(
      this.activeAiAgents,
      event.previousIndex,
      event.currentIndex
    );
    this.updateAiAgentOrder();
  }

  async updateAiAgentOrder() {
    if (!this.selectedActivity) {
      return;
    }

    try {
      const updatedAgents = this.activeAiAgents.map((agent, index) => ({
        aiAgentID: agent.aiAgentID,
        order: index + 1, // Assign new order based on index
      }));

      await this.http
        .post('ai-agents/order', {
          activityID: this.selectedActivity.activityID,
          agents: updatedAgents,
        })
        .toPromise();
    } catch (error) {
      this.snackbarService.queueSnackbar('Error updating AI agent order.');
      console.error('Error updating AI agent order:', error);
    }
  }

  async deleteAiAgent(agent: AiAgent, index: number) {
    try {
      await this.http.delete(`ai-agents/delete/${agent.aiAgentID}`).toPromise();
      this.activeAiAgents.splice(index, 1);
      this.updateAiAgentOrder(); //update order after deletion
    } catch (error) {
      this.snackbarService.queueSnackbar('Error deleting AI Agent');
      console.error('Error deleting AI Agent', error);
    }
  }

  async loadTeacherTasks() {
    if (!this.selectedActivity) {
      console.warn('No activity selected.');
      return;
    }

    try {
      this.teacherTasks =
        (await this.http
          .get<TeacherTask[]>(
            `teacher-tasks/activity/${this.selectedActivity.activityID}`
          )
          .toPromise()) || [];
      this.teacherTasks.sort((a, b) => a.order - b.order);

      //  Populate workflowMap
      await this.loadWorkflowsForActivity();
    } catch (error) {
      this.snackbarService.queueSnackbar('Error loading teacher tasks.');
      console.error('Error loading teacher tasks:', error);
    }
  }

  async loadWorkflowsForActivity() {
    if (!this.selectedActivity) {
      return;
    }
    try {
      const board = await this.boardService.get(this.selectedActivity.boardID);
      if (!board) {
        return;
      }
      const workflows = await this.workflowService.getAll(board.boardID);
      this.workflowMap.clear(); // Clear existing entries
      workflows.forEach((workflow) => {
        this.workflowMap.set(workflow.workflowID, workflow.name);
      });
    } catch (error) {
      console.error('Failed to load workflows', error);
    }
  }

  getWorkflowName(workflowID: string | null | undefined): string {
    if (!workflowID) return 'Workflow Not Found';
    return this.workflowMap.get(workflowID) || 'Loading...';
  }

  async getSelectedBoard(): Promise<Board | undefined> {
    if (this.selectedActivity) {
      try {
        const board = await this.boardService.get(
          this.selectedActivity.boardID
        );
        return board;
      } catch (error) {
        console.error('Error fetching board:', error);
        return undefined;
      }
    } else {
      return undefined;
    }
  }

  handleTeacherTaskClick(task: TeacherTask) {
    switch (task.type) {
      case 'regroupStudents':
        this.openGroupDialog();
        break;
      case 'viewCanvas':
      case 'viewBuckets':
      case 'viewWorkspace':
      case 'viewTodos':
        this.getSelectedBoard().then((board) => {
          if (board) {
            // Map task.type to componentType
            let componentType = '';
            switch (task.type) {
              case 'viewCanvas':
                componentType = 'canvas';
                break;
              case 'viewBuckets':
                componentType = 'bucketView';
                break;
              case 'viewTodos':
                componentType = 'monitor';
                break;
              case 'viewWorkspace':
                componentType = 'workspace';
                break;
            }
            this.openViewModal(componentType, this.project, board);
          } else {
            console.error('Selected board is undefined');
          }
        });
        break;
      case 'activateWorkflow':
        this.openWorkflowBucketModal(2);
        break;
      case 'customPrompt':
        this.editCustomPrompt(task);
        break;
      case 'showJoinCode':
        this.showJoinCode(task);
        break;
      default:
        // Handle other task types or do nothing
        break;
    }
  }

  start(activity: Activity) {
    if (!this.selectedActivity) {
      return;
    }
    // Construct the resource list object.
    const resources = this.selectedActivityResources.map((res) => ({
      name: res.name,
      order: res.order,
      groupIDs: res.groupIDs,
      canvas: res.canvas,
      bucketView: res.bucketView,
      workspace: res.workspace,
      monitor: res.monitor,
      ideaAgent: res.ideaAgent,
    }));

    // Emit the event with the correct structure:
    this.socketService.emit(SocketEvent.RESOURCES_UPDATE, {
      eventData: {
        // This matches the RoomcastData interface
        projectID: this.project.projectID,
        resources: resources,
      },
    });
  }

  openRoomCasting() {
    this.router.navigate(['/roomcast', this.project.projectID]);
  }

  editActivity(activity: Activity) {
    const dialogRef = this.dialog.open(EditActivityModalComponent, {
      data: {
        project: this.project,
        activity: activity,
      },
    });

    dialogRef
      .afterClosed()
      .subscribe((result: { activity: Activity; delete: boolean }) => {
        if (result) {
          if (result.delete) {
            this.deleteActivity(result.activity);
          } else {
            this.updateActivity(result.activity);
          }
        }
      });
  }

  async updateActivity(activity: Activity) {
    try {
      const updatedActivity = await this.http
        .put(`activities/${activity.activityID}`, activity)
        .toPromise();

      // Update the activity in the activities list
      const index = this.activities.findIndex(
        (a) => a.activityID === activity.activityID
      );
      if (index !== -1) {
        this.activities[index] = updatedActivity as Activity;
      }

      // If the updated activity is the selected one, update the selectedActivity and selectedActivityGroups
      if (this.selectedActivity?.activityID === activity.activityID) {
        this.selectedActivity = updatedActivity as Activity;
        this.fetchActivityGroups(this.selectedActivity.groupIDs);
      }
    } catch (error) {
      this.snackbarService.queueSnackbar('Error updating activity.');
      console.error('Error updating activity:', error);
    }
  }

  async deleteActivity(activity: Activity) {
    try {
      // 1. (Optional) Ask for confirmation before deleting

      // 2. Call the API to delete the activity
      await this.http.delete(`activities/${activity.activityID}`).toPromise();

      // 3. Remove the activity from the activities list
      this.activities = this.activities.filter(
        (a) => a.activityID !== activity.activityID
      );

      // 4. If the deleted activity was the selected one, clear the selection
      if (this.selectedActivity?.activityID === activity.activityID) {
        this.selectedActivity = null;
        this.selectedActivityResources = []; // Clear resources as well
        this.selectedActivityGroups = []; // Clear groups as well
      }
    } catch (error) {
      this.snackbarService.queueSnackbar('Error deleting activity.');
      console.error('Error deleting activity:', error);
    }
  }

  async getSelectedBoardName(): Promise<string> {
    if (this.selectedActivity) {
      try {
        const board = await this.boardService.get(
          this.selectedActivity.boardID
        );
        return board ? board.name : '';
      } catch (error) {
        console.error('Error fetching board name:', error);
        return '';
      }
    }
    return '';
  }

  dropResource(event: CdkDragDrop<any[]>) {
    moveItemInArray(
      this.selectedActivityResources,
      event.previousIndex,
      event.currentIndex
    );
    this.updateResourceOrder();
  }

  dropResourceFromAvailable(event: CdkDragDrop<any[]>) {
    const resource = this.availableResources[event.previousIndex];

    this.createResource(resource)
      .then((newResource) => {
        this.availableResources.splice(event.previousIndex, 1);
        this.selectedActivityResources.splice(
          event.currentIndex,
          0,
          newResource
        );
        this.updateResourceOrder();
      })
      .catch((error) => {
        console.error('Error creating resource:', error);
      });
  }

  async createResource(resourceData: any): Promise<any> {
    try {
      const newResourceData = {
        resourceID: generateUniqueID(), // Add resourceID
        name: resourceData.name,
        activityID: this.selectedActivity!.activityID,
        [resourceData.type]: true,
        order: this.selectedActivityResources.length + 1,
      };

      const response = await this.http
        .post('resources/create', newResourceData)
        .toPromise();
      return response as Resource;
    } catch (error) {
      this.snackbarService.queueSnackbar('Error creating resource.');
      console.error('Error creating resource:', error);
      throw error; // Re-throw the error to be caught in the calling function
    }
  }

  async deleteResource(resource: Resource, index: number) {
    try {
      // 1. Delete the resource from the database
      await this.http
        .delete(`resources/delete/${resource.resourceID}`)
        .toPromise();

      // 2. Remove the resource from the list
      this.selectedActivityResources.splice(index, 1);

      // 3. Update the resource order in the database
      this.updateResourceOrder();

      // 4. If the resources pane is open, update the available resources
      if (this.showResourcesPane) {
        this.filterAvailableResources();
      }
    } catch (error) {
      this.snackbarService.queueSnackbar('Error deleting resource.');
      console.error('Error deleting resource:', error);
    }
  }

  dropActivity(event: CdkDragDrop<Activity[]>) {
    moveItemInArray(this.activities, event.previousIndex, event.currentIndex);
    this.updateActivityOrder();
  }

  async updateActivityOrder() {
    try {
      const updatedActivities = this.activities.map((activity, index) => ({
        activityID: activity.activityID,
        order: index + 1, // Assign new order based on index
      }));

      await this.http
        .post('activities/order/', { activities: updatedActivities })
        .toPromise();
    } catch (error) {
      this.snackbarService.queueSnackbar('Error updating activity order.');
      console.error('Error updating activity order:', error);
    }
  }

  async updateResourceOrder() {
    if (!this.selectedActivity) {
      return; // Do nothing if no activity is selected
    }

    try {
      const updatedResources = this.selectedActivityResources.map(
        (resource, index) => ({
          resourceID: resource.resourceID,
          order: index + 1,
        })
      );

      await this.http
        .post('resources/order/', {
          activityID: this.selectedActivity.activityID,
          resources: updatedResources,
        })
        .toPromise();
    } catch (error) {
      this.snackbarService.queueSnackbar('Error updating resource order.');
      console.error('Error updating resource order:', error);
    }
  }

  async fetchActivityResources(activityID: string) {
    try {
      // ... (Implement logic to fetch resources for the activity) ...
      this.selectedActivityResources =
        (await this.http
          .get<Resource[]>(`resources/activity/${activityID}`)
          .toPromise()) || [];
    } catch (error) {
      this.snackbarService.queueSnackbar('Error fetching activity resources.');
      console.error('Error fetching activity resources:', error);
    }
  }

  async fetchActivityGroups(groupIDs: string[]) {
    try {
      this.selectedActivityGroups = await this.groupService.getMultipleBy(
        groupIDs
      ); // Example using GroupService
    } catch (error) {
      this.snackbarService.queueSnackbar('Error fetching activity groups.');
      console.error('Error fetching activity groups:', error);
    }
  }

  async updateBucketAndWorkflowCounts() {
    if (!this.selectedActivity) {
      return;
    }

    try {
      const board = await this.boardService.get(this.selectedActivity.boardID);
      if (board) {
        // Fetch buckets using BucketService
        const buckets = await this.bucketService.getAllByBoard(board.boardID);
        this.bucketCount = buckets ? buckets.length : 0;

        // Fetch workflows using WorkflowService's getAll() method
        const workflows = await this.workflowService.getAll(board.boardID);
        this.workflowCount = workflows.length;
      } else {
        this.snackbarService.queueSnackbar(
          'Error: Could not find selected board.'
        );
      }
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  }

  openGroupDialog() {
    this.dialog.open(ManageGroupModalComponent, {
      data: {
        project: this.project,
      },
    });
  }

  async openWorkflowBucketModal(selectedTabIndex: number) {
    if (!this.selectedActivity) {
      return;
    }

    try {
      const board = await this.boardService.get(this.selectedActivity.boardID);
      if (board) {
        this._openDialog(CreateWorkflowModalComponent, {
          board: board,
          project: this.project,
          selectedTabIndex: selectedTabIndex,
        });
      } else {
        this.snackbarService.queueSnackbar(
          'Error: Could not find selected board.'
        );
      }
    } catch (error) {
      console.error('Error fetching board:', error);
      this.snackbarService.queueSnackbar(
        'Error opening Workflows & Buckets modal.'
      );
    }
  }

  private _openDialog(
    component: ComponentType<unknown>,
    data: any,
    width = '700px'
  ) {
    this.dialog.open(component, {
      maxWidth: 1280,
      width: width,
      autoFocus: false, // Add this line to disable autofocus
      data: data,
    });
  }

  openCreateActivityModal() {
    const dialogRef = this.dialog.open(CreateActivityModalComponent, {
      data: {
        project: this.project,
        createActivity: this.createActivity,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.createActivity(result);
      }
    });
  }

  createActivity = async (activityData: Activity) => {
    try {
      const response = await this.http
        .post('activities/', activityData)
        .toPromise();
      const newActivity: Activity = response as Activity;

      this.activities.push(newActivity);
      this.selectActivity(newActivity);
      console.log('New Activity created.');
    } catch (error) {
      this.snackbarService.queueSnackbar('Error creating activity.');
      console.error('Error creating activity:', error);
    }
  };

  addResourceToActivity(resource: Resource) {
    this.showResourcesPane = false;
  }

  dropTeacherActionFromAvailable(event: CdkDragDrop<any[]>) {
    const action = this.availableTeacherActions[event.previousIndex];

    // Call a function to handle creating the teacher task
    this.createTeacherTask(action);
  }

  dropTeacherAction(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.teacherTasks, event.previousIndex, event.currentIndex);
    this.updateTeacherTaskOrder();
  }

  getIconForTask(task: any): string {
    const action = this.availableTeacherActions.find(
      (a) => a.type === task.type
    );
    return action ? action.icon : '';
  }

  async createTeacherTask(actionData: any) {
    try {
      let taskData: Partial<TeacherTask> = {
        taskID: generateUniqueID(),
        name: actionData.name,
        activityID: this.selectedActivity!.activityID,
        order: this.teacherTasks.length + 1,
        type: actionData.type,
        // ... other properties you might need for teacher tasks ...
      };

      // Open a modal based on the action type
      if (actionData.type === 'activateWorkflow') {
        const updatedTaskData = await this.openWorkflowModal(taskData);
        if (updatedTaskData) {
          taskData = updatedTaskData;
        } else {
          return;
        }
      } else if (actionData.type === 'activateAiAgent') {
        const { updatedTaskData, selectedAiAgentId } =
          await this.openAiAgentModal(taskData);
        taskData = updatedTaskData;
      } else if (actionData.type === 'customPrompt') {
        const updatedTaskData = await this.openCustomPromptModal(taskData);
        if (updatedTaskData) {
          taskData = updatedTaskData;
        } else {
          return;
        }
      }
      // ... add more cases for other action types as needed ...

      // If taskData is not null (i.e., the modal was not canceled), create the task
      if (taskData) {
        const newTask = await this.http
          .post('teacher-tasks/', taskData)
          .toPromise();
        this.teacherTasks.push(newTask);
        this.updateTeacherTaskOrder();

        this.selectedTabIndex = 0;
      }
    } catch (error) {
      this.snackbarService.queueSnackbar('Error creating teacher task.');
      console.error('Error creating teacher task:', error);
    }
  }

  openConfigurationModal() {
    if (!this.selectedActivity) {
      return;
    }

    this.boardService
      .get(this.selectedActivity.boardID)
      .then((board) => {
        if (board) {
          this.dialog.open(ConfigurationModalComponent, {
            data: {
              project: this.project,
              board: board,
              update: (updatedBoard: Board, removed = false) => {
                if (removed) {
                  // Handle board removal if necessary
                  this.snackbarService.queueSnackbar(
                    'Board removed successfully.'
                  );
                  // You might want to update your UI here, e.g., by refreshing the activities list
                } else {
                  // Update the board in your component
                  this.selectedBoardName = updatedBoard.name; // Assuming you want to update the displayed board name
                  // You might need to update other parts of your UI that depend on the board data
                }
              },
            },
          });
        } else {
          this.snackbarService.queueSnackbar(
            'Error: Could not find selected board.'
          );
        }
      })
      .catch((error) => {
        console.error('Error fetching board:', error);
        this.snackbarService.queueSnackbar(
          'Error: Could not open configuration.'
        );
      });
  }

  openViewModal(componentType: string, project: Project, board: Board) {
    const dialogRef = this.dialog.open(ScoreViewModalComponent, {
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '80vh',
      width: '90vw',
      panelClass: 'score-view-modal-dialog',
      data: {
        componentType,
        project,
        board,
        user: this.user,
      },
    });

    dialogRef.componentInstance.projectID = project.projectID;
    dialogRef.componentInstance.boardID = board.boardID;

    dialogRef.afterClosed().subscribe((result) => {
      // Handle any actions after closing the modal (if needed)
    });
  }

  async openWorkflowModal(taskData: Partial<TeacherTask>): Promise<any> {
    const dialogRef = this.dialog.open(SelectWorkflowModalComponent, {
      width: '500px',
      data: {
        boardID: this.selectedActivity!.boardID,
        taskData: taskData, //still needed for the create workflow option
        board: await this.boardService.get(this.selectedActivity!.boardID),
        project: this.project,
      },
    });

    const result = await dialogRef.afterClosed().toPromise();

    if (result && result.shouldOpenCreateModal) {
      this.openWorkflowBucketModal(1);
      return null; // Important: Consistent return type
    } else if (result) {
      //user selected workflow
      const updatedTaskData = {
        ...taskData,
        workflowID: result,
      };
      return updatedTaskData;
    } else {
      return null; // User cancelled
    }
  }

  openTeacherAgentModal() {
    this.getSelectedBoard().then((board) => {
      if (board) {
        this._openDialog(CreateWorkflowModalComponent, {
          // Reuse the existing modal component
          board: board,
          project: this.project,
          selectedTabIndex: 3,
        });
      } else {
        console.error('Selected board is undefined');
      }
    });
  }

  showJoinCode(task: TeacherTask) {
    const dialogRef = this.dialog.open(ShowJoinCodeComponent, {
      width: '800px',
      height: '400px',
      data: { joinCode: this.project.studentJoinCode }, // Pass the project's join code
    });
  }

  async openAiAgentModal(taskData: any): Promise<any> {
    const dialogRef = this.dialog.open(ConfigureAiAgentModalComponent, {
      // Assuming you create this component
      data: {
        // ... pass any necessary data for AI agent selection ...
        taskData: taskData,
      },
    });

    return dialogRef.afterClosed().toPromise();
  }

  async openCustomPromptModal(taskData: any): Promise<any> {
    const dialogRef = this.dialog.open(CustomTeacherPromptModalComponent, {
      width: '500px',
      data: { taskData: taskData }, // Pass any data needed by the modal
    });

    const result = await dialogRef.afterClosed().toPromise();

    if (result) {
      const updatedTaskData = {
        ...taskData,
        customPrompt: result, // Store the prompt in the taskData
      };
      return updatedTaskData;
    } else {
      return null; // Indicate cancellation
    }
  }

  async editCustomPrompt(task: TeacherTask) {
    const dialogRef = this.dialog.open(CustomTeacherPromptModalComponent, {
      width: '500px',
      data: { prompt: task.customPrompt }, // Pass the existing prompt
    });

    const result = await dialogRef.afterClosed().toPromise();

    if (result) {
      // Update the task with the new prompt
      try {
        const updatedTask = await this.http
          .put<TeacherTask>(`teacher-tasks/${task.taskID}`, {
            ...task,
            customPrompt: result,
          })
          .toPromise();

        if (updatedTask) {
          // Update the task in the teacherTasks array
          const index = this.teacherTasks.findIndex(
            (t) => t.taskID === updatedTask.taskID
          );
          if (index !== -1) {
            this.teacherTasks[index] = updatedTask;
          }
        } else {
          // Handle the case where the update failed (e.g., show an error)
          this.snackbarService.queueSnackbar(
            'Error updating prompt: Update failed.'
          );
          console.error('Error updating prompt: API returned null/undefined');
        }
      } catch (error) {
        this.snackbarService.queueSnackbar('Error updating prompt.');
        console.error('Error updating prompt:', error);
      }
    }
  }

  async updateTeacherTaskOrder() {
    if (!this.selectedActivity) {
      console.warn('No activity selected.');
      return;
    }

    try {
      const updatedTasks = this.teacherTasks.map((task, index) => ({
        taskID: task.taskID,
        order: index + 1,
      }));

      await this.http
        .post('teacher-tasks/order/', {
          activityID: this.selectedActivity.activityID,
          tasks: updatedTasks,
        })
        .toPromise();

      await this.loadTeacherTasks();
    } catch (error) {
      this.snackbarService.queueSnackbar('Error updating teacher task order.');
      console.error('Error updating teacher task order:', error);
    }
  }

  async deleteTeacherTask(task: any, index: number) {
    try {
      await this.http.delete(`teacher-tasks/delete/${task.taskID}`).toPromise();
      this.teacherTasks.splice(index, 1);
      this.updateTeacherTaskOrder(); // Update order after deleting a task
    } catch (error) {
      this.snackbarService.queueSnackbar('Error deleting teacher task.');
      console.error('Error deleting teacher task:', error);
    }
  }

  toggleResourcesPane() {
    this.showResourcesPane = !this.showResourcesPane;

    if (this.showResourcesPane) {
      this.filterAvailableResources(); // Filter resources when the pane is opened
    }
  }

  async toggleResourceGroupAssignment(resource: Resource, group: Group) {
    try {
      let updatedResource;
      if (this.isResourceAssignedToGroup(resource, group)) {
        // Remove the group from the resource
        updatedResource = await this.http
          .delete(`resources/${resource.resourceID}/groups/${group.groupID}`)
          .toPromise();
      } else {
        // Add the group to the resource
        updatedResource = await this.http
          .post(`resources/${resource.resourceID}/groups/${group.groupID}`, {})
          .toPromise();
      }

      // Update the resource in the list
      const resourceIndex = this.selectedActivityResources.findIndex(
        (r) => r.resourceID === resource.resourceID
      );
      if (resourceIndex !== -1) {
        this.selectedActivityResources[resourceIndex] =
          updatedResource as Resource;
      }
    } catch (error) {
      this.snackbarService.queueSnackbar(
        `Error ${
          this.isResourceAssignedToGroup(resource, group)
            ? 'removing'
            : 'adding'
        } group assignment.`
      );
      console.error(
        `Error ${
          this.isResourceAssignedToGroup(resource, group)
            ? 'removing'
            : 'adding'
        } group assignment:`,
        error
      );
    }
  }

  toggleClassroomBindings() {
    this.showClassroomBindings = !this.showClassroomBindings;

    if (this.showClassroomBindings) {
      // Add a slight delay before initializing the canvas
      setTimeout(() => {
        this.initializeCanvas();
      }, 100); // Adjust the delay as needed
    } else {
      this.canvas?.dispose();
      this.canvas = undefined;
    }
  }

  isResourceAssignedToGroup(resource: Resource, group: Group): boolean {
    return resource.groupIDs.includes(group.groupID);
  }

  filterAvailableResources() {
    const existingResourceNames = new Set(
      this.selectedActivityResources.map((r) => r.name)
    );
    this.availableResources = this.allAvailableResources.filter(
      (resource) => !existingResourceNames.has(resource.name)
    );
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(
      this.selectedActivityResources,
      event.previousIndex,
      event.currentIndex
    );
  }

  ngOnDestroy(): void {
    this.listeners.map((l) => l.unsubscribe());
  }

  signOut(): void {
    this.userService.logout();
    this.router.navigate(['login']);
  }
}
