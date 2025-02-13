import {
  Component,
  Inject,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  AfterViewInit,
} from '@angular/core';
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
  AssignmentType,
} from 'src/app/models/workflow';
import { SocketService } from 'src/app/services/socket.service';
import { PostService } from 'src/app/services/post.service';
import { BoardService } from 'src/app/services/board.service';
import { BucketService } from 'src/app/services/bucket.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { GroupService } from 'src/app/services/group.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { WorkflowService } from 'src/app/services/workflow.service';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';
import { generateUniqueID } from 'src/app/utils/Utils';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import User, { AuthUser, Role } from 'src/app/models/user';
import { SocketEvent } from 'src/app/utils/constants';
import { saveAs } from 'file-saver';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Component({
  selector: 'app-create-workflow-modal',
  templateUrl: './create-workflow-modal.component.html',
  styleUrls: ['./create-workflow-modal.component.scss'],
})
export class CreateWorkflowModalComponent implements OnInit, OnDestroy {
  // Properties
  selected = new UntypedFormControl(0); // Controls which tab is currently selected (0: Buckets, 1: Create, 2: Manage)
  user: AuthUser;

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

  aiPrompt = '';
  aiResponse = '';
  isWaitingForAIResponse = false;
  isProcessingAIRequest = false;
  waitingMessage = 'Waiting for AI Response...';

  chatHistory: ChatMessage[] = [];

  // Common fields between all workflows
  WorkflowType: typeof WorkflowType = WorkflowType;
  taskWorkflowType: typeof TaskWorkflowType = TaskWorkflowType;
  workflowType: WorkflowType = WorkflowType.GENERATION;
  AssignmentType: typeof AssignmentType = AssignmentType;
  assignmentType: AssignmentType = AssignmentType.GROUP;
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
  assignedIndividual: Group;
  commentsRequired = false;
  tagsRequired = false;
  postGeneration = 1;

  bucketNameFormControl = new UntypedFormControl('valid', [
    Validators.required,
    this._forbiddenNameValidator(),
  ]);
  workflowNameFormControl = new UntypedFormControl('valid', [
    Validators.required,
  ]);
  sourceFormControl = new UntypedFormControl('valid', [Validators.required]);
  destinationFormControl = new UntypedFormControl('valid', [
    Validators.required,
  ]);

  sourceDestinationMatchError = new UntypedFormControl(false);

  groupsFormControl = new UntypedFormControl('valid', [Validators.required]);
  promptFormControl = new UntypedFormControl('valid', [Validators.required]);

  workflowTypeFormControl = new UntypedFormControl('valid', [
    Validators.required,
  ]);
  removeFromSourceFormControl = new UntypedFormControl('valid', [
    Validators.required,
  ]);

  tagsFormControl = new UntypedFormControl();

  matcher = new MyErrorStateMatcher();
  snackbarConfig: MatSnackBarConfig;

  // Store the socket listener
  aiResponseListener: Subscription | undefined;

  @ViewChild('scrollableDiv') private scrollableDiv!: ElementRef;
  @ViewChild('aiInput') aiInput: ElementRef;

  constructor(
    public userService: UserService,
    public dialogRef: MatDialogRef<CreateWorkflowModalComponent>,
    private dialog: MatDialog,
    private snackbarService: SnackbarService,
    public bucketService: BucketService,
    public boardService: BoardService,
    private postService: PostService,
    public workflowService: WorkflowService,
    public canvasService: CanvasService,
    public groupService: GroupService,
    private http: HttpClient,
    private socketService: SocketService,
    private changeDetectorRef: ChangeDetectorRef,
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
    this.user = this.userService.user!;

    // Set the selected tab index if provided
    if (this.data.selectedTabIndex !== undefined) {
      this.selected.setValue(this.data.selectedTabIndex);
    }

    if (this.data.focusAIInput) {
      setTimeout(() => {
        this.focusAIInput();
      }, 0);
    }
  }

  ngAfterViewInit(): void {
    this.selected.valueChanges.subscribe((tabIndex) => {
      if (tabIndex === 3) {
        // Check if AI Assistant tab is selected
        setTimeout(() => {
          // Use setTimeout to allow the view to render
          this.focusAIInput();
        }, 0);
      }
    });
  }

  focusAIInput() {
    if (this.aiInput) {
      this.aiInput.nativeElement.focus();
    }
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

      // Add project boards FIRST (using fallback empty array if undefined)
      this.destOptions = this.destOptions.concat(projectBoards || []);
      this.sourceOptions = this.sourceOptions.concat(projectBoards || []);

      // 2. Fetch Buckets
      const buckets = await this.bucketService.getAllByBoard(
        this.data.board.boardID
      );
      this.boardBuckets = this.boardBuckets.concat(buckets || []);

      // 3. Add buckets SECOND
      this.sourceOptions = this.sourceOptions.concat(buckets || []);
      this.destOptions = this.destOptions.concat(buckets || []);
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

  startWaitingForAIResponse() {
    this.isWaitingForAIResponse = true;
    this.waitingMessage = 'Waiting for AI response...';
  }

  updateWaitingForAIResponse(message: string) {
    this.isWaitingForAIResponse = true;
    this.waitingMessage = message;
  }

  // Call this function when the response is received
  stopWaitingForAIResponse() {
    this.isWaitingForAIResponse = false;
    this.waitingMessage = '';
  }

  askAI() {
    if (this.isProcessingAIRequest) {
      // Check the flag
      return;
    }
    this.isProcessingAIRequest = true;

    this.startWaitingForAIResponse();
    this.aiResponse = '';

    // 1. Fetch all posts for the current board
    this.fetchBoardPosts().then((posts) => {
      const currentPrompt = this.aiPrompt;
      this.aiPrompt = ''; // Clear the prompt field

      // Construct the complete prompt including chat history
      const fullPromptHistory = this.constructPromptWithHistory(currentPrompt);

      this.chatHistory.push({ role: 'user', content: currentPrompt });

      // Wait for the change detection to run and render the new message
      this.changeDetectorRef.detectChanges();
      this.scrollToBottom();

      // 2. Send data and prompt to the backend via WebSocket
      this.socketService.emit(SocketEvent.AI_MESSAGE, {
        posts,
        currentPrompt: currentPrompt,
        fullPromptHistory: fullPromptHistory,
        boardId: this.board.boardID,
        userId: this.user.userID,
      });

      // 3. Listen for WebSocket events
      this.aiResponseListener = this.socketService.listen(
        SocketEvent.AI_RESPONSE,
        (data: any) => {
          try {
            switch (data.status) {
              case 'Received': {
                this.updateWaitingForAIResponse('Received message...');
                break;
              }
              case 'Processing': {
                this.updateWaitingForAIResponse(data.response);
                break;
              }
              case 'Completed': {
                const dataResponse = data.response;
                this.aiResponse = this.markdownToHtml(dataResponse || '');
                this.chatHistory.push({
                  role: 'assistant',
                  content: this.aiResponse,
                });
                this.stopWaitingForAIResponse();
                break;
              }
              case 'Error': {
                console.error('AI request error:', data.errorMessage);
                this.chatHistory.push({
                  role: 'assistant',
                  content: data.errorMessage,
                });
                this.stopWaitingForAIResponse();
                break;
              }
              default: {
                console.warn('Unknown status:', data.status);
              }
            }

            if (data.status === 'Completed' || data.status === 'Error') {
              if (this.aiResponseListener) {
                this.aiResponseListener.unsubscribe();
              }
            }

            this.changeDetectorRef.detectChanges();
            this.scrollToBottom();
          } catch (error) {
            this.chatHistory.push({
              role: 'assistant',
              content:
                'An error occurred. Please refresh your browser and try again.\n\n' +
                error,
            });
            this.stopWaitingForAIResponse();
            if (this.aiResponseListener) {
              this.aiResponseListener.unsubscribe();
            }
          }
        }
      );
    });
    this.isProcessingAIRequest = false;
  }

  // Helper function to construct the prompt with chat history
  constructPromptWithHistory(currentPrompt: string): string {
    let fullPrompt = '';

    // Add each message from the chat history to the prompt
    this.chatHistory.forEach((message) => {
      fullPrompt += `${message.role}: ${message.content}\n`;
    });

    // Add the current prompt at the end
    fullPrompt += `user: ${currentPrompt}`;

    return fullPrompt;
  }

  downloadChatHistory() {
    // Generate timestamp in the desired format
    const timestamp = new Date()
      .toLocaleDateString('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      .replace(/\//g, '-')
      .replace(/, /g, '-');

    const filename = `chat_history-${timestamp}.csv`;

    const data = {
      boardId: this.board.boardID,
      userId: this.user.userID,
      filename: filename, // Add filename to the data
    };

    this.http
      .post('chat-history', data, {
        responseType: 'blob',
      })
      .subscribe(
        (response) => {
          const blob = new Blob([response], { type: 'text/csv' });
          saveAs(blob, filename);
          this.openSnackBar('Chat history downloaded successfully!');
        },
        (error) => {
          console.error('Error downloading chat history:', error);
          this.openSnackBar(`Error downloading chat history: ${error.message}`);
        }
      );
  }

  private escapeJsonResponse(response: string): string {
    if (!response) {
      return '';
    }

    const responseStartIndex =
      response.indexOf('"response": "') + '"response": "'.length;
    const responseEndIndex = response.indexOf('<END>');

    if (responseStartIndex === -1 || responseEndIndex === -1) {
      console.warn('Invalid response format:', response);
      return response; // Or handle the error differently
    }

    const responseValue = response.substring(
      responseStartIndex,
      responseEndIndex
    );
    const escapedValue = JSON.stringify(responseValue).slice(1, -1); // Escape special characters

    return (
      response.substring(0, responseStartIndex) +
      escapedValue +
      response.substring(responseEndIndex)
    );
  }

  // Method to scroll the div to the bottom
  scrollToBottom(): void {
    const scrollableElement = this.scrollableDiv.nativeElement;
    scrollableElement.scrollTo({
      top: scrollableElement.scrollHeight,
      behavior: 'smooth', // Add smooth scrolling behavior
    });
  }

  markdownToHtml(markdown: string): string {
    const lines = markdown.split('\\n');
    let html = '';
    let inList = false;
    let inSublist = false;
    let inBold = false;
    let inOrderedList = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Bolding handling (applied to all lines)
      while (line.includes('**')) {
        if (inBold) {
          line = line.replace('**', '</strong>');
          inBold = false;
        } else {
          line = line.replace('**', '<strong>');
          inBold = true;
        }
      }

      // Double quote handling
      while (line.includes('\\"')) {
        line = line.replace('\\"', '"');
      }

      if (line.match(/^(\*|-) /)) {
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        if (inSublist) {
          html += '</ul>';
          inSublist = false;
        }
        html += `<li>${line.substring(2)}</li>`;
      } else if (line.match(/^ +(\*|-) /)) {
        // Match sublist items
        if (!inSublist) {
          html += '<ul>';
          inSublist = true;
        }
        html += `<li>${line.trim().substring(2)}</li>`;
      } else if (line.match(/^\d+\. /)) {
        // Match ordered list items
        if (!inOrderedList) {
          html += '<ol>';
          inOrderedList = true;
        }
        html += `<li>${line.substring(line.indexOf('. ') + 2)}</li>`;
      } else if (inOrderedList) {
        // Close the ordered list if no more items
        html += '</ol>';
        inOrderedList = false;
        html += line; // Add the current line after closing the list
      } else if (inList) {
        if (inSublist) {
          html += '</ul>';
          inSublist = false;
        }
        html += '</ul>';
        inList = false;
        html += line;
      } else if (line === '') {
        html += '<br>';
      } else {
        html += line;
      }
    }

    if (inSublist) {
      html += '</ul>';
    }
    if (inList) {
      html += '</ul>';
    }
    if (inOrderedList) {
      // Close the ordered list if it's still open
      html += '</ol>';
    }

    return html;
  }

  async fetchBoardPosts() {
    try {
      // Fetch posts for the current board
      const posts = await this.postService.getAllByBoard(this.board.boardID);
      return posts;
    } catch (error) {
      console.error('Error fetching board posts:', error);
      // Handle the error, e.g., show an error message to the user
      return []; // Return an empty array in case of an error
    }
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
      assignmentType: this.assignmentType,
      assignedIndividual: this.assignedIndividual,
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
      assignmentType: this.assignmentType,
      assignedIndividual: this.assignedIndividual,
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

  ngOnDestroy() {
    if (this.aiResponseListener) {
      this.aiResponseListener.unsubscribe();
    }
  }
}
