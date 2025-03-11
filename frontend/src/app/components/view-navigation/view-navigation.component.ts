import { Component, Input, OnInit } from '@angular/core';
import { Board, ViewType } from 'src/app/models/board';
import { BoardService } from 'src/app/services/board.service';
import { AuthUser, Role } from 'src/app/models/user';
import { UserService } from 'src/app/services/user.service';

type ViewConfig = {
  viewType: ViewType;
  urlPath: string;
  icon: string;
  displayName: string;
  allowed: boolean;
};

@Component({
  selector: 'app-view-navigation',
  templateUrl: './view-navigation.component.html',
  styleUrls: ['./view-navigation.component.scss'],
})
export class ViewNavigationComponent implements OnInit {
  @Input() boardID: string;
  @Input() currentView: ViewType;

  user: AuthUser;
  board: Board;
  AppViews: ViewConfig[] = [];
  isTeacher: boolean = false;
  constructor(
    public boardService: BoardService,
    public userService: UserService
  ) {}

  async ngOnInit(): Promise<void> {
    const board = await this.boardService.get(this.boardID);
    this.user = this.userService.user!;
    this.isTeacher = this.user.role === Role.TEACHER;
    if (!board) {
      // Handle the case where board is undefined, e.g., throw an error or redirect
      console.error(`Board with ID ${this.boardID} not found`);
      return; // or handle it accordingly
    }

    this.board = board;

    this.AppViews = [
      {
        viewType: ViewType.CANVAS,
        urlPath: 'canvas',
        icon: 'dashboard',
        displayName: 'Canvas',
        allowed:
          this.isTeacher || (this.board.viewSettings?.allowCanvas ?? false),
      },
      {
        viewType: ViewType.BUCKETS,
        urlPath: 'buckets',
        icon: 'view_week',
        displayName: 'Bucket View',
        allowed:
          this.isTeacher || (this.board.viewSettings?.allowBuckets ?? false),
      },
      {
        viewType: ViewType.WORKSPACE,
        urlPath: 'workspace',
        icon: 'check_box',
        displayName: 'CK Workspace',
        allowed:
          this.isTeacher || (this.board.viewSettings?.allowWorkspace ?? false),
      },
      {
        viewType: ViewType.MONITOR,
        urlPath: 'monitor',
        icon: 'trending_up',
        displayName: 'CK Monitor',
        allowed:
          this.isTeacher || (this.board.viewSettings?.allowMonitor ?? false),
      },
      {
        viewType: ViewType.IDEAS,
        urlPath: 'ideas',
        icon: 'lightbulb',
        displayName: 'CK Ideas',
        allowed: this.isTeacher,
      },
    ];
  }
}
