import { ComponentType } from '@angular/cdk/portal';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core'; // Import Output and EventEmitter
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { Router } from '@angular/router';
import { Board, BoardScope } from 'src/app/models/board';
import { Project } from 'src/app/models/project';
import { AuthUser, Role } from 'src/app/models/user';
import { UserService } from 'src/app/services/user.service';
import { CreateWorkflowModalComponent } from '../create-workflow-modal/create-workflow-modal.component';
import { ListModalComponent } from '../list-modal/list-modal.component';
import { ManageGroupModalComponent } from '../groups/manage-group-modal/manage-group-modal.component';
import { ConfigurationModalComponent } from '../configuration-modal/configuration-modal.component';
import { BucketsModalComponent } from '../buckets-modal/buckets-modal.component';

@Component({
  selector: 'app-toolbar-menu',
  templateUrl: './toolbar-menu.component.html',
  styleUrls: ['./toolbar-menu.component.scss'],
})
export class ToolbarMenuComponent implements OnInit {
  @Input() board: Board;
  @Input() project: Project;
  @Input() user: AuthUser; // Correctly receive the user

  @Output() copyEmbedCodeClick = new EventEmitter<void>(); // Output event
  @Output() copyPersonalEmbedCodeClick = new EventEmitter<void>(); // Output event


  Role: typeof Role = Role;
  BoardScope: typeof BoardScope = BoardScope;
  showMenu: boolean = false;

  constructor(
    private userService: UserService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.userService.user!;
  }

  openWorkflowDialog() {
    this._openDialog(CreateWorkflowModalComponent, {
      board: this.board,
      project: this.project,
    });
  }

  // New method to open the AI Assistant tab
  openAIAssistantDialog() {
    this._openDialog(CreateWorkflowModalComponent, {
      board: this.board,
      project: this.project,
      selectedTabIndex: 3, // Pass the desired tab index
      focusAIInput: true,
    });
  }

  showListModal() {
    this._openDialog(
      ListModalComponent,
      {
        board: this.board,
        user: this.user,
        // TODO: configure for this.canvas.getCenter().left
        centerX: 0,
        // TODO: configure for this.canvas.getCenter().top
        centerY: 0,
      },
      '95vw'
    );
  }

  openSettingsDialog() {
    this._openDialog(ConfigurationModalComponent, {
      project: this.project,
      board: this.board,
      update: (board: Board, removed = false) => {
        const previousBoard = this.board;
        this.board = board;

        if (previousBoard.initialZoom !== board.initialZoom) {
          // this.configureZoom(); TODO: emit to parent
        }
      },
    });
  }

  openProjectTodoList() {
    this.router.navigate([`/project/${this.project.projectID}/todo`]);
  }

  openGroupDialog() {
    this.dialog.open(ManageGroupModalComponent, {
      data: {
        project: this.project,
      },
    });
  }

  showBucketsModal() {
    this._openDialog(
      BucketsModalComponent,
      {
        board: this.board,
        user: this.user,
        centerX: 0,
        centerY: 0,
      },
      '95vw'
    );
  }

  copyEmbedCode() {
    if (this.board && this.project) {
        const url = window.location.origin + `/project/${this.project.projectID}/board/${this.board.boardID}` + '?embedded=true';
        navigator.clipboard.writeText(url);
    } else {
        console.warn("Board or Project is not defined. Cannot copy embed code.");
    }

}

copyPersonalEmbedCode() {
    if (this.board && this.project) {
      const url =
        window.location.origin +
        `/project/${this.project.projectID}/my-personal-board?embedded=true`;
      navigator.clipboard.writeText(url);
    }
    else{
        console.warn("Board or Project is not defined. Cannot copy personal embed code.");
    }
}

  signOut(): void {
    this.userService.logout();
    this.router.navigate(['login']);
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
