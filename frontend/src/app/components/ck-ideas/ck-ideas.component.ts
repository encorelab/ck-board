// frontend/src/app/components/ck-ideas/ck-ideas.component.ts

import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { ComponentType } from '@angular/cdk/portal';
import { SocketService } from 'src/app/services/socket.service';
import { Subscription } from 'rxjs';
import { SocketEvent } from 'src/app/utils/constants';
import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ChangeDetectorRef,
  ElementRef,
  Input,
} from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
// MatLegacySlideToggleModule is not directly used in the template, can be removed if not needed elsewhere
import { ActivatedRoute, Router } from '@angular/router'; // Import Router
import { Board, BoardScope, ViewType } from 'src/app/models/board';
import { Project } from 'src/app/models/project';
import { AuthUser, Role } from 'src/app/models/user';
import { BoardService } from 'src/app/services/board.service';
import { BucketService } from 'src/app/services/bucket.service';
import { CommentService } from 'src/app/services/comment.service';
import Post, { PostType } from 'src/app/models/post';
import { PostService } from 'src/app/services/post.service';
import { ProjectService } from 'src/app/services/project.service';
import { UpvotesService } from 'src/app/services/upvotes.service';
import { UserService } from 'src/app/services/user.service'; // UserService is already here
import Converters from 'src/app/utils/converters';
// import { CreateWorkflowModalComponent } from '../create-workflow-modal/create-workflow-modal.component'; // Not used
// import { CanvasService } from 'src/app/services/canvas.service'; // Not used
import { HttpClient } from '@angular/common/http';
import { saveAs } from 'file-saver';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { FormControl } from '@angular/forms';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Component({
  selector: 'app-ck-ideas',
  templateUrl: './ck-ideas.component.html',
  styleUrls: ['./ck-ideas.component.scss'],
})
export class CkIdeasComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild('scrollableDiv') private scrollableDiv!: ElementRef;

  @Input() boardID_input?: string;
  @Input() projectID_input?: string;
  @Input() embedded: boolean = false;

  boardID?: string;
  projectID?: string;

  ideaBuckets: any[] = [];
  user!: AuthUser;
  board: Board | undefined;
  project!: Project;
  Role: typeof Role = Role; // Expose Role enum for template if needed elsewhere
  ViewType: typeof ViewType = ViewType;
  BoardScope: typeof BoardScope = BoardScope;  
  isTeacherAndAllowed: boolean = false;
  canvasUsed: boolean = false;
  viewType = ViewType.IDEAS;
  unsubListeners: Subscription[] = [];
  aiPrompt = '';
  aiResponse = '';
  isWaitingForAIResponse = false;
  isProcessingAIRequest = false;
  waitingMessage = 'Waiting for AI Response...';
  chatHistory: ChatMessage[] = [];
  aiResponseListener: Subscription | undefined;
  ideaAgentRawResponse: any | null = null;
  ideaAgentFormattedResponse: string | null = null;
  pendingIdeaAgentRawResponse: any | null = null;
  pendingIdeaAgentFormattedResponse: string | null = null;
  newSummaryAvailable: boolean = false;
  showRawResponse: boolean = false;
  isWaitingForIdeaAgent = false;
  waitingIdeaMessage = 'Waiting for AI Response...';
  selectedContexts: any[] = [];
  ideaAgentResponseListener: Subscription | undefined;
  topicContext: FormControl = new FormControl('');

  constructor(
    public postService: PostService,
    public boardService: BoardService,
    public projectService: ProjectService,
    public bucketService: BucketService,
    public userService: UserService,
    private snackbarService: SnackbarService,
    public dialog: MatDialog,
    public commentService: CommentService,
    public upvotesService: UpvotesService,
    private converters: Converters,
    private router: Router, // Injected Router
    private socketService: SocketService,
    private activatedRoute: ActivatedRoute,
    private changeDetectorRef: ChangeDetectorRef,
    private http: HttpClient
  ) {}

  async ngOnInit(): Promise<void> {
    this.user = this.userService.user!;
    
    if (this.user.role !== Role.TEACHER) {
      this.isTeacherAndAllowed = false;
      console.warn("[CK-IDEAS] Access Denied: User is not a teacher.", this.user.username, this.user.role);
      // If not embedded and user is not a teacher, you might want to navigate them away.
      // For embedded scenarios, the template will show the access denied message.
      if (!this.embedded) {
        this.snackbarService.queueSnackbar("Access Denied: This tool is for teachers only.");
        // Consider navigating to a default/dashboard page if this component is accessed via a direct route by a non-teacher
        // Example: this.router.navigate(['/dashboard']);
      }
      this.changeDetectorRef.detectChanges(); // Ensure view updates if showing a message
      return; // Stop further initialization if not a teacher
    }
    this.isTeacherAndAllowed = true;
    // End of role check

    // Prioritize @Input values if embedded, otherwise use route params
    if (this.embedded && this.boardID_input && this.projectID_input) {
        this.boardID = this.boardID_input;
        this.projectID = this.projectID_input;
        console.log("[CK-IDEAS Embedded] Initializing with BoardID:", this.boardID, "ProjectID:", this.projectID);
    } else if (!this.embedded) {
        const map = this.activatedRoute.snapshot.paramMap;
        this.boardID = map.get('boardID') ?? undefined;
        this.projectID = map.get('projectID') ?? undefined;
        console.log("[CK-IDEAS Routed] Initializing with BoardID:", this.boardID, "ProjectID:", this.projectID);
    } else {
        console.error("[CK-IDEAS Embedded] Missing boardID_input or projectID_input for embedded mode.");
        this.snackbarService.queueSnackbar('Error: Required information missing for Idea Agent.');
        this.isTeacherAndAllowed = false; // Prevent content rendering
        return;
    }

    if (this.boardID && this.projectID) {
      try {
        this.board = await this.boardService.get(this.boardID);
        this.project = await this.projectService.get(this.projectID);

        if (!this.board || !this.project) {
            console.error("[CK-IDEAS] Board or Project data could not be fetched with IDs:", this.boardID, this.projectID);
            throw new Error("Board or Project data could not be fetched.");
        }
        // Navigation guard for non-teacher is now handled by the role check above if not embedded.
        // If embedded, the parent component should ideally not show the tab/modal to non-teachers.
        // This internal check is an additional layer.

        this.ideaBuckets = (await this.bucketService.getAllByBoard(this.boardID)) || [];
        
        // Socket connection only if not embedded (or based on specific needs for embedded mode)
        if (!this.embedded) {
            this.socketService.connect(this.user.userID, this.boardID);
        }

        this.ideaAgentFormattedResponse =
          '<ol><li>Consider adding a <b>Topic Context</b> <em>(above)</em> to improve relevance of summary</li><li>Select post <b>Source</b> using "+" button <em>(top right)</em></li><li>To regenerate, click the <b>refresh</b> button <em>(in this AI Summary heading)</em></li><li>(If needed) If you get a model error, please refresh the summary or page</li></ol>';
        this.isWaitingForIdeaAgent = false;
        this.selectedContexts = ['None'];

        const storedContext = localStorage.getItem(`topicContext_${this.boardID}`);
        if (storedContext) {
          this.topicContext.setValue(storedContext);
        }
        this.waitingIdeaMessage = '';

        this.topicContext.valueChanges.subscribe((value) => {
          localStorage.setItem(`topicContext_${this.boardID}`, value);
        });

      } catch (error) {
        console.error('[CK-IDEAS] Failed to configure board or project:', error);
        this.snackbarService.queueSnackbar('Error loading Idea Agent data.');
        this.isTeacherAndAllowed = false; // Prevent content rendering on error
        if (!this.embedded) this.router.navigate(['/error']);
      }
    } else {
      console.error('[CK-IDEAS] boardID or projectID is missing after initialization attempt!');
      this.snackbarService.queueSnackbar('Required information missing for Idea Agent.');
      this.isTeacherAndAllowed = false; // Prevent content rendering
      if (!this.embedded) this.router.navigate(['/error']);
    }
  }

  copyEmbedCode() {
    if (!this.boardID || !this.projectID) {
        this.snackbarService.queueSnackbar("Cannot copy embed code: board or project ID missing.");
        return;
    }
    // Ensure ViewType.IDEAS.toLowerCase() is correct or use a string literal
    const ideasViewPath = (this.viewType as ViewType).toString().toLowerCase();
    const url = `${window.location.origin}/project/${this.projectID}/board/${this.boardID}/${ideasViewPath}?embedded=true`;
    navigator.clipboard.writeText(url).then(() => {
        this.snackbarService.queueSnackbar("Embeddable URL copied to clipboard!");
    }).catch(err => {
        this.snackbarService.queueSnackbar("Failed to copy URL.");
        console.error('Failed to copy embed code:', err);
    });
  }

  copyPersonalEmbedCode() {
    const url =
      window.location.origin +
      `/project/${this.projectID}/my-personal-board?embedded=true`;
    navigator.clipboard.writeText(url);
  }

  // --- Context Selection ---

  toggleContext(item: any): void {
    // Remove 'None' context if it exists and a new context is added
    if (item !== 'None' && this.selectedContexts.includes('None')) {
      this.selectedContexts = this.selectedContexts.filter((i) => i !== 'None');
    }

    if (item === 'None') {
      // Handle 'None' selection
      this.selectedContexts = ['None'];
      this.canvasUsed = false; // Assuming 'None' means no canvas
      this.ideaAgentFormattedResponse =
        'Please select a context using the plus button in the top right.'; // Reset prompt
      this.ideaAgentRawResponse = null; // Also clear raw response
      this.showRawResponse = false;
    } else if (this.isSelected(item)) {
      //Existing logic
      this.selectedContexts = this.selectedContexts.filter((i) => i !== item);
    } else {
      this.selectedContexts.push(item);
      if (item === this.board) {
        //If canvas is added.
        this.canvasUsed = true;
      }
    }

    // Disable refresh button if only 'None' is selected
    this.isWaitingForIdeaAgent =
      this.selectedContexts.length === 1 && this.selectedContexts[0] === 'None';

    // Refresh the idea agent whenever context changes, unless 'None' selected
    if (
      !(
        this.selectedContexts.length === 1 &&
        this.selectedContexts[0] === 'None'
      )
    ) {
      this.refreshIdeaAgent();
    }
  }

  isSelected(item: any): boolean {
    return this.selectedContexts.some((i) => i === item);
  }

  // --- AI Chat (Right Pane) Methods ---
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
      return;
    }
    this.isProcessingAIRequest = true;

    this.startWaitingForAIResponse();
    this.aiResponse = '';

    // 1. Fetch all posts for the specified canvas and bucket contexts
    this.fetchPostsForIdeaAgent(this.canvasUsed, this.getSelectedBucketIds())
      .then((posts) => {
        const currentPrompt = this.aiPrompt;
        this.aiPrompt = ''; // Clear the prompt field

        // Construct the complete prompt including chat history
        const fullPromptHistory =
          this.constructPromptWithHistory(currentPrompt);

        this.chatHistory.push({ role: 'user', content: currentPrompt });

        // Wait for the change detection to run and render the new message
        this.changeDetectorRef.detectChanges();
        this.scrollToBottom();

        // 2. Send data and prompt to the backend via WebSocket
        this.socketService.emit(SocketEvent.AI_MESSAGE, {
          posts,
          currentPrompt: currentPrompt,
          fullPromptHistory: fullPromptHistory,
          boardId: this.board?.boardID ?? '',
          userId: this.user.userID,
          type: 'teacher_agent',
        });

        // 3. Listen for WebSocket events
        if (this.aiResponseListener) {
          this.aiResponseListener.unsubscribe();
        }
        this.aiResponseListener = this.socketService.listen(
          SocketEvent.AI_RESPONSE,
          (data: any) => {
            try {
              if (data.type === 'teacher_agent') {
                switch (data.status) {
                  case 'Received': {
                    this.updateWaitingForAIResponse('Receiving message...');
                    break;
                  }
                  case 'Processing': {
                    this.updateWaitingForAIResponse('Processing message...');
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
                    this.isProcessingAIRequest = false;
                    break;
                  }
                  case 'Error': {
                    console.error('AI request error:', data.errorMessage);
                    this.chatHistory.push({
                      role: 'assistant',
                      content: data.errorMessage,
                    });
                    this.stopWaitingForAIResponse();
                    this.isProcessingAIRequest = false;
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
              this.isProcessingAIRequest = false; //Add this for safety
              if (this.aiResponseListener) {
                this.aiResponseListener.unsubscribe();
              }
            }
          }
        );
      })
      .catch((error) => {
        // Handle fetchBoardPosts errors
        console.error('Error fetching posts for AI:', error);
        this.openSnackBar(
          'Failed to fetch posts for the AI. Please try again.'
        );
        this.stopWaitingForAIResponse();
        this.isProcessingAIRequest = false;
        if (this.aiResponseListener) {
          this.aiResponseListener.unsubscribe();
        }
      });
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

  async fetchBoardPosts() {
    try {
      // Fetch posts for the current board
      const posts = await this.postService.getAllByBoard(this.boardID);
      return posts;
    } catch (error) {
      console.error('Error fetching board posts:', error);
      // Handle the error - propagate it
      throw error; // Re-throw the error to be caught in askAI()
    }
  }

  downloadChatHistory() {
    const data = {
      boardId: this.board?.boardID,
      userId: this.user.userID,
    };

    this.http
      .post('chat-history', data, {
        responseType: 'blob',
      })
      .subscribe(
        (response) => {
          const blob = new Blob([response], { type: 'text/csv' });
          saveAs(blob, 'chat_history.csv');
          this.openSnackBar('Chat history downloaded successfully!');
        },
        (error) => {
          console.error('Error downloading chat history:', error);
          this.openSnackBar(`Error downloading chat history: ${error.message}`);
        }
      );
  }

  scrollToBottom(): void {
    if (this.scrollableDiv) {
      const scrollableElement = this.scrollableDiv.nativeElement;
      scrollableElement.scrollTo({
        top: scrollableElement.scrollHeight,
        behavior: 'smooth', // Add smooth scrolling behavior
      });
    }
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

  openSnackBar(message: string): void {
    this.snackbarService.queueSnackbar(message);
  }

  signOut(): void {
    this.userService.logout();
    this.router.navigate(['login']);
  }

  // --- Idea Agent (Left Pane) Methods ---

  startWaitingForIdeaAgent() {
    this.isWaitingForIdeaAgent = true;
    this.waitingIdeaMessage = 'Waiting for AI response...';
  }

  updateWaitingForIdeaAgent(message: string) {
    this.isWaitingForIdeaAgent = true;
    this.waitingIdeaMessage = message;
  }
  stopWaitingForIdeaAgent() {
    this.isWaitingForIdeaAgent = false;
    this.waitingIdeaMessage = '';
  }

  // New helper function to get selected bucket IDs
  getSelectedBucketIds(): string[] {
    return this.selectedContexts
      .filter((context) => context.bucketID) // Filter for buckets (assuming buckets have a bucketID property)
      .map((bucket) => bucket.bucketID);
  }

  async fetchPostsForIdeaAgent(
    canvasUsed: boolean,
    bucketIDs: string[]
  ): Promise<any[]> {
    try {
      let allPosts: any[] = [];

      if (canvasUsed) {
        const canvasPosts = await this.postService.getAllByBoard(this.boardID);
        allPosts = allPosts.concat(
          canvasPosts.filter((post) => post.type === PostType.BOARD)
        );
      }

      if (bucketIDs.length > 0) {
        const bucketPostsPromises = bucketIDs.map((bucketID) =>
          this.postService.getAllByBucket(bucketID)
        );
        const bucketPostsArrays = await Promise.all(bucketPostsPromises);

        // Extract posts from each bucket response and add to allPosts, avoiding duplicates
        bucketPostsArrays.forEach((bucketResponse) => {
          if (
            bucketResponse &&
            bucketResponse.posts &&
            Array.isArray(bucketResponse.posts)
          ) {
            bucketResponse.posts.forEach((post: any) => {
              // Check for duplicates using postID before adding
              if (
                !allPosts.some(
                  (existingPost) => existingPost.postID === post.postID
                )
              ) {
                allPosts.push(post);
              }
            });
          }
        });
      }

      return allPosts;
    } catch (error) {
      console.error('Error fetching posts for Idea Agent:', error);
      this.openSnackBar(
        'Failed to fetch posts for the Idea Agent. Please try again.'
      );
      throw error;
    }
  }

  displayNewSummary() {
    this.ideaAgentRawResponse = this.pendingIdeaAgentRawResponse;
    this.ideaAgentFormattedResponse = this.pendingIdeaAgentFormattedResponse;
    this.newSummaryAvailable = false;
    this.pendingIdeaAgentRawResponse = null;
    this.pendingIdeaAgentFormattedResponse = null;
  }

  async refreshIdeaAgent() {
    if (this.isWaitingForIdeaAgent) {
      return;
    }

    // If a new summary is available, reset and start a new request
    if (this.newSummaryAvailable) {
      this.newSummaryAvailable = false;
      this.pendingIdeaAgentRawResponse = null;
      this.pendingIdeaAgentFormattedResponse = null;
    }

    this.startWaitingForIdeaAgent();
    // this.ideaAgentRawResponse = null; // Don't clear immediately
    // this.ideaAgentFormattedResponse = null; // Don't clear immediately

    try {
      const bucketIDs = this.getSelectedBucketIds();

      const posts = await this.fetchPostsForIdeaAgent(
        this.canvasUsed,
        bucketIDs
      );

      const topicContextValue = this.topicContext.value;
      const contextPrompt = `${
        topicContextValue ? topicContextValue : 'N/A'
      }\n`;

      // Emit to AI_MESSAGE with type: 'idea_agent'
      if (this.ideaAgentResponseListener) {
        this.ideaAgentResponseListener.unsubscribe();
      }
      this.socketService.emit(SocketEvent.AI_MESSAGE, {
        posts,
        currentPrompt: contextPrompt,
        fullPromptHistory: contextPrompt, // Even though it's for the idea agent, keep the naming consistent
        boardId: this.board?.boardID,
        userId: this.user.userID,
        type: 'idea_agent',
      });

      // Listen for AI_RESPONSE, but check the type
      this.ideaAgentResponseListener = this.socketService.listen(
        SocketEvent.AI_RESPONSE,
        (data: any) => {
          try {
            if (data.type === 'idea_agent') {
              switch (data.status) {
                case 'Received': {
                  this.waitingIdeaMessage = 'Receiving message...';
                  this.changeDetectorRef.detectChanges(); // Force update

                  break;
                }
                case 'Processing': {
                  this.waitingIdeaMessage = 'Processing message...';
                  this.changeDetectorRef.detectChanges(); // Force update
                  break;
                }
                case 'Completed': {
                  const dataResponse = data.response;

                  // Check if current response is empty
                  if (!this.ideaAgentRawResponse) {
                    // Populate directly if empty
                    this.ideaAgentRawResponse = dataResponse;
                    this.ideaAgentFormattedResponse = this.markdownToHtml(
                      dataResponse || ''
                    );
                    this.newSummaryAvailable = false;
                  } else {
                    // Store in pending variables
                    this.pendingIdeaAgentRawResponse = dataResponse;
                    this.pendingIdeaAgentFormattedResponse =
                      this.markdownToHtml(dataResponse || '');
                    this.newSummaryAvailable = true; // Set flag
                  }
                  this.stopWaitingForIdeaAgent();
                  this.isWaitingForIdeaAgent = false;
                  this.changeDetectorRef.detectChanges(); // Force update

                  break;
                }
                case 'Error': {
                  console.error('AI request error:', data.errorMessage);
                  // Store in pending, even on error
                  this.pendingIdeaAgentRawResponse = data.errorMessage;
                  this.pendingIdeaAgentFormattedResponse = data.errorMessage;
                  this.newSummaryAvailable = true; // Allow user to see error
                  this.stopWaitingForIdeaAgent();
                  this.isWaitingForIdeaAgent = false;
                  this.changeDetectorRef.detectChanges(); // Force update

                  break;
                }
                default: {
                  console.warn('Unknown status:', data.status);
                }
              }
              if (data.status === 'Completed' || data.status === 'Error') {
                if (this.ideaAgentResponseListener) {
                  this.ideaAgentResponseListener.unsubscribe();
                }
              }
            }
          } catch (error) {
            this.ideaAgentRawResponse = 'An error occurred';
            this.ideaAgentFormattedResponse =
              'An error occurred. Please refresh your browser and try again.\n\n' +
              error;
            this.stopWaitingForIdeaAgent();
            this.isWaitingForIdeaAgent = false;
            if (this.ideaAgentResponseListener) {
              this.ideaAgentResponseListener.unsubscribe();
            }
          }
        }
      );
    } catch (error) {
      this.stopWaitingForIdeaAgent();
      this.isWaitingForIdeaAgent = false;
      if (this.ideaAgentResponseListener) {
        this.ideaAgentResponseListener.unsubscribe();
      }
    }
  }

  async ngOnDestroy() {
    this.unsubListeners.forEach((s) => s.unsubscribe());
    // Only disconnect if not embedded and boardID is present
    if (this.boardID && !this.embedded && this.user) {
      this.socketService.disconnect(this.user.userID, this.boardID);
    }
    if (this.aiResponseListener) {
      this.aiResponseListener.unsubscribe();
    }
    if (this.ideaAgentResponseListener) {
      this.ideaAgentResponseListener.unsubscribe();
    }
  }
}
