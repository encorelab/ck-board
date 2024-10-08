import { Component, Input, OnInit } from '@angular/core';
import { Board, ViewType } from 'src/app/models/board';
import { BoardService } from 'src/app/services/board.service';

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

  board: Board;
  AppViews: ViewConfig[] = [];
  constructor(public boardService: BoardService) {}

  async ngOnInit(): Promise<void> {
    const board = await this.boardService.get(this.boardID);

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
        allowed: this.board.viewSettings?.allowCanvas ?? false,
      },
      {
        viewType: ViewType.BUCKETS,
        urlPath: 'buckets',
        icon: 'view_week',
        displayName: 'Bucket View',
        allowed: this.board.viewSettings?.allowBuckets ?? false,
      },
      {
        viewType: ViewType.WORKSPACE,
        urlPath: 'workspace',
        icon: 'check_box',
        displayName: 'CK Workspace',
        allowed: this.board.viewSettings?.allowWorkspace ?? false,
      },
      {
        viewType: ViewType.MONITOR,
        urlPath: 'monitor',
        icon: 'trending_up',
        displayName: 'CK Monitor',
        allowed: this.board.viewSettings?.allowMonitor ?? false,
      },
    ];
  }
}
