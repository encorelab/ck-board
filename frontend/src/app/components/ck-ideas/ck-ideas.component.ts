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

// Have to add Idea Service to store the idea buckets values, canvas used and conversations on view
@Component({
  selector: 'app-ck-ideas',
  templateUrl: './ck-ideas.component.html',
  styleUrls: ['./ck-ideas.component.scss'],
})
export class CkIdeasComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild('scrollableDiv') private scrollableDiv!: ElementRef;

  boardID: string;
  projectID: string;

  canvasHTMLPosts: any[] = [];
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

  maxConversationsOnView = 4;
  conversationsOnView: any[] = []; //stores the buckets and canvas that are being used for conversations with AI at the moment
  viewType = ViewType.IDEAS;

  groupEventToHandler: Map<SocketEvent, Function>;
  unsubListeners: Subscription[] = [];

  aiPrompt = '';
  aiResponse = '';
  isWaitingForAIResponse = false;
  isProcessingAIRequest = false;
  waitingMessage = 'Waiting for AI Response...';

  chatHistory: ChatMessage[] = [];

  aiResponseListener: Subscription | undefined;

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
    await this.configureBoard();
    await this.bucketService.getAllByBoard(this.boardID).then((buckets) => {
      if (buckets) {
        for (const bucket of buckets) {
          if (bucket.addedToView) {
            this.conversationsOnView.push(bucket);
            this.loadBucketPosts(bucket);
          } else {
            this.ideaBuckets.push(bucket);
          }
        }
      }
    });
    if (this.board && this.canvasUsed) {
      this.conversationsOnView.push(this.board);
      this.loadCanvasPosts();
    }
    this.socketService.connect(this.user.userID, this.boardID);
  }

  initGroupEventsListener() {
    for (const [k, v] of this.groupEventToHandler) {
      const unsub = this.socketService.listen(k, v);
      this.unsubListeners.push(unsub);
    }
  }

  async configureBoard(): Promise<void> {
    const map = this.activatedRoute.snapshot.paramMap;
    if (map.has('boardID') && map.has('projectID')) {
      this.boardID = this.activatedRoute.snapshot.paramMap.get('boardID') ?? '';
      this.projectID =
        this.activatedRoute.snapshot.paramMap.get('projectID') ?? '';
      const board = await this.boardService.get(this.boardID);
      if (board) {
        this.board = board;
        if (
          !this.isTeacher &&
          board.viewSettings &&
          !board.viewSettings.allowIdeas
        ) {
          this.router.navigateByUrl(
            `project/${this.projectID}/board/${
              this.boardID
            }/${board.defaultView?.toLowerCase()}`
          );
        }
      } else {
        this.board = undefined;
      }

      this.projectService.get(this.projectID).then((project) => {
        this.project = project;
      });
    }
  }

  async loadBucketPosts(bucket: any) {
    if (!bucket.htmlPosts) {
      bucket.loading = true;
      bucket.htmlPosts = await this.converters.toHTMLPosts(bucket.posts);
      bucket.loading = false;
    }
  }

  async loadCanvasPosts() {
    console.log('in the load function');
    console.log('canvas used ', this.canvasUsed);
    console.log('canvas html posts: ', this.canvasHTMLPosts);
    console.log('conversations on view: ', this.conversationsOnView);
    console.log('buckets: ', this.ideaBuckets);

    if (!this.canvasHTMLPosts) {
      console.log('no html posts');
      this.postService.getAllByBoard(this.boardID).then((data) => {
        data.forEach(async (post) => {
          if (post.type == PostType.BOARD) {
            this.canvasHTMLPosts.push(this.converters.toHTMLPost(post));
            console.log('added post here');
          }
        });
      });
    }
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

  addBucketConversation(bucket: any, index: number) {
    if (bucket && index >= 0 && index < this.ideaBuckets.length) {
      this.ideaBuckets.splice(index, 1);
      this.conversationsOnView.push(bucket);
    }
  }

  addCanvasConversation() {
    if (!this.canvasUsed) {
      this.canvasUsed = true;
      this.conversationsOnView.push(this.board);
      this.loadCanvasPosts();
    }
  }

  removeConversationFromView(index: number, bucket?: any) {
    if (bucket) {
      this.ideaBuckets.push(bucket);
      this.conversationsOnView.splice(index, 1);
    } else {
      this.canvasUsed = false;
      this.conversationsOnView.splice(index, 1);
    }
  }

  removeCanvasFromView(index: number) {
    if (this.canvasUsed) {
      this.canvasUsed = false;
      this.conversationsOnView.splice(index, 1);
    }
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
      const prompt = this.aiPrompt;
      this.aiPrompt = ''; // Clear the prompt field

      this.chatHistory.push({ role: 'user', content: prompt });

      // Wait for the change detection to run and render the new message
      this.changeDetectorRef.detectChanges();
      this.scrollToBottom();

      // 2. Send data and prompt to the backend via WebSocket
      this.socketService.emit(SocketEvent.AI_MESSAGE, {
        posts,
        prompt,
        boardId: this.board?.boardID,
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

  async fetchBoardPosts() {
    try {
      // Fetch posts for the current board
      const posts = await this.postService.getAllByBoard(this.board?.boardID);
      return posts;
    } catch (error) {
      console.error('Error fetching board posts:', error);
      // Handle the error, e.g., show an error message to the user
      return []; // Return an empty array in case of an error
    }
  }

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

  openSnackBar(message: string): void {
    this.snackbarService.queueSnackbar(message);
  }

  signOut(): void {
    this.userService.logout();
    this.router.navigate(['login']);
  }

  async ngOnDestroy() {
    this.unsubListeners.forEach((s) => s.unsubscribe());
    this.socketService.disconnect(this.user.userID, this.boardID);
  }

  private _openDialog(
    component: ComponentType<unknown>,
    data: any,
    width = '700px'
  ) {
    this.dialog.open(component, {
      maxWidth: 1280,
      width: width,
      autoFocus: false,
      data: data,
    });
  }
}
