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
} from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
import { ActivatedRoute, Router } from '@angular/router';
import { Board, BoardScope, ViewType } from 'src/app/models/board';
import { Project } from 'src/app/models/project';
import { AuthUser, Role } from 'src/app/models/user';
import { BoardService } from 'src/app/services/board.service';
import { BucketService } from 'src/app/services/bucket.service';
import { CommentService } from 'src/app/services/comment.service';
import { PostService } from 'src/app/services/post.service';
import { ProjectService } from 'src/app/services/project.service';
import { UpvotesService } from 'src/app/services/upvotes.service';
import { UserService } from 'src/app/services/user.service';
import Converters from 'src/app/utils/converters';
import { CreateWorkflowModalComponent } from '../create-workflow-modal/create-workflow-modal.component';
import { CanvasService } from 'src/app/services/canvas.service';
import Post, { PostType } from 'src/app/models/post';
import { HttpClient } from '@angular/common/http';
import { saveAs } from 'file-saver';
import { SnackbarService } from 'src/app/services/snackbar.service';

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
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('scrollableDiv') private scrollableDiv!: ElementRef;

  boardID: string | undefined;
  projectID: string | undefined;

  ideaBuckets: any[] = [];
  boards: any[] = [];
  user: AuthUser;
  board: Board | undefined;
  project: Project;
  Role: typeof Role = Role;
  ViewType: typeof ViewType = ViewType;
  BoardScope: typeof BoardScope = BoardScope;
  isTeacher: boolean = false;
  canvasUsed: boolean = false; //determines if the conversation involving canvas is used

  viewType = ViewType.IDEAS;

  groupEventToHandler: Map<SocketEvent, Function>;
  unsubListeners: Subscription[] = [];

  // AI Chat (Right Pane) Variables
  aiPrompt = '';
  aiResponse = '';
  isWaitingForAIResponse = false;
  isProcessingAIRequest = false;
  waitingMessage = 'Waiting for AI Response...';
  chatHistory: ChatMessage[] = [];
  aiResponseListener: Subscription | undefined;

  // Idea Agent (Left Pane) Variables
  ideaAgentResponse = '';
  isWaitingForIdeaAgent = false;
  waitingIdeaMessage = 'Waiting for AI Response...';
  private readonly ideaAgentPrompt =
    'Summarize the following context into concise key ideas:'; // Hardcoded prompt base
  selectedContexts: any[] = []; // To store selected buckets/canvas
  ideaAgentResponseListener: Subscription | undefined;

  constructor(
    public postService: PostService,
    public boardService: BoardService,
    public projectService: ProjectService,
    public bucketService: BucketService,
    public canvasService: CanvasService,
    public userService: UserService,
    private snackbarService: SnackbarService,
    public dialog: MatDialog,
    public commentService: CommentService,
    public upvotesService: UpvotesService,
    private converters: Converters,
    private router: Router,
    private socketService: SocketService,
    private activatedRoute: ActivatedRoute,
    private changeDetectorRef: ChangeDetectorRef,
    private http: HttpClient
  ) {
    this.groupEventToHandler = new Map<SocketEvent, Function>([]);
  }

  async ngOnInit(): Promise<void> {
    this.user = this.userService.user!;
    this.isTeacher = this.user.role === Role.TEACHER;
    const { boardID, projectID, board } = await this.configureBoard(); // Destructure board as well
    this.boardID = boardID;
    this.projectID = projectID;
    this.board = board; // Assign the returned board

    if (this.boardID && this.projectID) {
        await this.bucketService.getAllByBoard(this.boardID).then((buckets) => {
            if (buckets) {
                this.ideaBuckets = buckets;
            }
        });
        this.socketService.connect(this.user.userID, this.boardID);

        if (this.board) {  // This check is now more reliable
            this.selectedContexts.push(this.board);
        }
        this.refreshIdeaAgent();
    } else {
        console.error("Failed to configure board!");
        this.router.navigate(['/error']);
    }
}

  initGroupEventsListener() {
    for (const [k, v] of this.groupEventToHandler) {
      const unsub = this.socketService.listen(k, v);
      this.unsubListeners.push(unsub);
    }
  }

  async configureBoard(): Promise<{ boardID?: string; projectID?: string; board?: Board }> { // Return board
    const map = this.activatedRoute.snapshot.paramMap;
    if (map.has('boardID') && map.has('projectID')) {
        const boardID = map.get('boardID') ?? undefined;
        const projectID = map.get('projectID') ?? undefined;

        if (boardID && projectID) {
            const board = await this.boardService.get(boardID);
            if (board) {
                // No longer directly assigning to this.board here
                if (!this.isTeacher && board.viewSettings && !board.viewSettings.allowIdeas) {
                    this.router.navigateByUrl(
                      `project/<span class="math-inline">{projectID}/board/</span>{boardID}/${board.defaultView?.toLowerCase()}`
                    );
                }
                 this.projectService.get(projectID).then((project) => { //moved here
                    this.project = project;
                });
                return { boardID, projectID, board }; // Return the board object
            } else {
                return { boardID, projectID, board: undefined }; // Explicitly return undefined
            }
        }
    }
    return { board: undefined }; // Return undefined board
}


  copyEmbedCode() {
    const url = window.location.href + '?embedded=true';
    navigator.clipboard.writeText(url);
  }

  copyPersonalEmbedCode() {
    const url =
      window.location.origin +
      `/project/${this.projectID}/my-personal-board?embedded=true`;
    navigator.clipboard.writeText(url);
  }

  // --- Context Selection ---

  toggleContext(item: any): void {
    if (this.isSelected(item)) {
      this.selectedContexts = this.selectedContexts.filter((i) => i !== item);
    } else {
      this.selectedContexts.push(item);
    }
    // Refresh the idea agent whenever context changes
    this.refreshIdeaAgent();
    if (item.name == this.board?.name) {
      this.canvasUsed = !this.canvasUsed;
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

  async fetchBoardPosts() {
    try {
      // Fetch posts for the current board
      const posts = await this.postService.getAllByBoard(this.boardID);
      return posts;
    } catch (error) {
      console.error('Error fetching board posts:', error);
      // Handle the error, e.g., show an error message to the user
      return []; // Return an empty array in case of an error
    }
  }

  downloadChatHistory() {
    const data = {
      boardId: this.board?.boardID,
      userId: this.user.userID,
    };

    this.http
      .post('chat-history', data, {
        //  Make sure your backend endpoint is correct
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
  refreshIdeaAgent() {
    if (this.isWaitingForIdeaAgent) {
      return; // Prevent concurrent requests
    }

    this.startWaitingForIdeaAgent();
    this.ideaAgentResponse = ''; // Clear previous response

    // Prepare context data (same logic as in askAI, but for the idea agent)
    const posts = this.selectedContexts.flatMap((context) => {
      if (context.posts) {
        return context.posts;
      } else if (context.postIDs) {
        return context.postIDs.map((id: string) => {
          return { postID: id };
        }); //just need the IDs to keep consistent with post structure
      }
    });

    // Construct the full prompt
    const fullPrompt = `${this.ideaAgentPrompt} ${JSON.stringify(posts)}`;

    // Emit to a *different* socket event for the Idea Agent
    this.socketService.emit(SocketEvent.AI_IDEA_MESSAGE, {
      // Use a different event!
      posts,
      prompt: fullPrompt, // Send the full prompt
      boardId: this.board?.boardID,
      userId: this.user.userID,
    });

    // Listen for the Idea Agent's specific response event
    this.ideaAgentResponseListener = this.socketService.listen(
      SocketEvent.AI_IDEA_RESPONSE, // Different listener!
      (data: any) => {
        try {
          switch (data.status) {
            case 'Received': {
              this.updateWaitingForIdeaAgent('Received message...');
              break;
            }
            case 'Processing': {
              this.updateWaitingForIdeaAgent(data.response);
              break;
            }
            case 'Completed': {
              const dataResponse = data.response;
              this.ideaAgentResponse = this.markdownToHtml(dataResponse || '');
              this.stopWaitingForIdeaAgent();
              break;
            }
            case 'Error': {
              console.error('AI request error:', data.errorMessage);
              this.ideaAgentResponse = data.errorMessage;
              this.stopWaitingForIdeaAgent();
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
          this.changeDetectorRef.detectChanges(); //important
        } catch (error) {
          this.ideaAgentResponse =
            'An error occurred. Please refresh your browser and try again.\n\n' +
            error;
          this.stopWaitingForIdeaAgent();
          if (this.ideaAgentResponseListener) {
            this.ideaAgentResponseListener.unsubscribe();
          }
        }
      }
    );
  }

  async ngOnDestroy() {
    this.unsubListeners.forEach((s) => s.unsubscribe());
    if (this.boardID) { // Check for undefined
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
