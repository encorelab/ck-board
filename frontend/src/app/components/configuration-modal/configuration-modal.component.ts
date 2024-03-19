import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  Board,
  BoardPermissions,
  BoardScope,
  ViewSettings,
  ViewType,
} from 'src/app/models/board';
import { Project } from 'src/app/models/project';
import { Tag } from 'src/app/models/tag';
import { BoardService } from 'src/app/services/board.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { FileUploadService } from 'src/app/services/fileUpload.service';
import { SocketService } from 'src/app/services/socket.service';
import { UpvotesService } from 'src/app/services/upvotes.service';
import { UserService } from 'src/app/services/user.service';
import { ImageSettings } from 'src/app/utils/FabricUtils';
import { generateUniqueID } from 'src/app/utils/Utils';
import {
  POST_TAGGED_BORDER_THICKNESS,
  SocketEvent,
  TAG_DEFAULT_COLOR,
} from 'src/app/utils/constants';
import { PostService } from '../../services/post.service';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-configuration-modal',
  templateUrl: './configuration-modal.component.html',
  styleUrls: ['./configuration-modal.component.scss'],
})
export class ConfigurationModalComponent {
  readonly tagDefaultColor = TAG_DEFAULT_COLOR;

  project: Project;
  board: Board;

  boardID: string;
  boardName: string;
  questionAuthoringType: string;

  defaultView: ViewType = ViewType.BUCKETS;
  viewSettings: ViewSettings;

  isTeacherPersonalBoard = false;

  currentBgImage: any;
  newCompressedImage: any;

  taskTitle: string;
  taskMessage: string;

  permissions: BoardPermissions;

  tags: Tag[];
  newTagText = '';
  newTagColor: any = TAG_DEFAULT_COLOR;
  _POST_TAGGED_BORDER_THICKNESS = POST_TAGGED_BORDER_THICKNESS;

  initialZoom = 100;
  upvoteLimit = 5;

  BoardScope: typeof BoardScope = BoardScope;

  bgImgSettings: ImageSettings;
  backgroundPosX;
  backgroundPosY;
  backgroundScale;
  tagsChanged = false;

  members: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<ConfigurationModalComponent>,
    public dialog: MatDialog,
    public postService: PostService,
    public boardService: BoardService,
    public userService: UserService,
    public upvoteService: UpvotesService,
    public canvasService: CanvasService,
    public fileUploadService: FileUploadService,
    public socketService: SocketService,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.project = data.project;
    this.board = data.board;
    this.boardID = data.board.boardID;
    this.boardName = data.board.name;
    this.currentBgImage = data.board.bgImage;
    this.taskTitle = data.board.task?.title;
    this.taskMessage = data.board.task?.message;
    this.tags = data.board.tags ?? [];
    this.permissions = data.board.permissions;
    this.initialZoom = data.board.initialZoom;
    this.bgImgSettings = data.board.bgImage?.imgSettings;
    this.backgroundPosX = this.bgImgSettings?.left;
    this.backgroundPosY = this.bgImgSettings?.top;
    this.backgroundScale = this.bgImgSettings
      ? Math.round(this.bgImgSettings.scaleX * 100)
      : 100;
    this.upvoteLimit = data.board.upvoteLimit;
    this.isTeacherPersonalBoard = this.project.teacherIDs.includes(
      this.board.ownerID
    );
    if (data.board.defaultView) {
      this.defaultView = data.board.defaultView;
      this.viewSettings = data.board.viewSettings;
    }
  }

  async addTag() {
    this.tagsChanged = true;
    this.tags.push({
      tagID: generateUniqueID(),
      boardID: this.boardID,
      name: this.newTagText,
      color: this.newTagColor,
    });
    await this.boardService.update(this.boardID, { tags: this.tags });
    this.newTagText = '';
  }

  async removeTag(tagRemove) {
    this.tagsChanged = true;
    this.tags = this.tags.filter((tag) => tag != tagRemove);
    await this.boardService.update(this.boardID, { tags: this.tags });
  }

  compressFile() {
    this.fileUploadService.compressFile().then(async (compressedImage) => {
      this.newCompressedImage = compressedImage;

      const board = await this.canvasService.updateBoardImage(
        this.boardID,
        this.newCompressedImage
      );
      this.data.update(board);
      this.currentBgImage = board.bgImage;
      if (board.bgImage) {
        this.bgImgSettings = board.bgImage.imgSettings;
        this.backgroundPosX = board.bgImage.imgSettings.left;
        this.backgroundPosY = board.bgImage.imgSettings.top;
        this.backgroundScale = board.bgImage
          ? Math.round(board.bgImage.imgSettings.scaleX * 100)
          : 100;
      }
    });
  }

  async updateBoardImageSettings(): Promise<Board> {
    this.bgImgSettings.top = this.backgroundPosY;
    this.bgImgSettings.left = this.backgroundPosX;
    this.bgImgSettings.scaleX = this.backgroundScale / 100;
    this.bgImgSettings.scaleY = this.backgroundScale / 100;

    const board: Board = await this.canvasService.updateBoardImageSettings(
      this.boardID,
      this.bgImgSettings
    );
    return board;
  }

  async removeImage() {
    this.currentBgImage = null;
    const board = await this.canvasService.updateBoardImage(this.boardID, null);
    this.data.update(board);
  }

  async handleDialogSubmit() {
    let board: Board;
    board = await this.canvasService.updateBoardName(
      this.boardID,
      this.boardName.trim()
    );
    board = await this.canvasService.updateBoardTask(
      this.boardID,
      this.taskTitle,
      this.taskMessage
    );
    board = await this.canvasService.updateBoardPermissions(
      this.boardID,
      this.permissions
    );
    board = await this.canvasService.updateBoardUpvotes(
      this.boardID,
      this.upvoteLimit
    );

    if (this.currentBgImage) board = await this.updateBoardImageSettings();

    board = await this.boardService.update(this.boardID, {
      initialZoom: this.initialZoom,
      defaultView: this.defaultView,
      viewSettings: this.viewSettings,
    });
    await this.data.update(board);
    this.dialogRef.close();
  }

  async ngOnDestroy(): Promise<void> {
    if (this.tagsChanged) {
      this.socketService.emit(
        SocketEvent.BOARD_TAGS_UPDATE,
        await this.boardService.get(this.boardID)
      );
    }
  }

  async handleClearBoard() {
    this.dialog.open(ConfirmModalComponent, {
      width: '500px',
      data: {
        title: 'Confirmation',
        message:
          'Are you sure you want to clear posts from this board? NOTE: Posts will be cleared from the board but remain in the the list view and any assigned buckets.',
        handleConfirm: async () => {
          this.postService.getAllByBoard(this.boardID).then(async (data) => {
            await this.canvasService.clearPostsFromBoard(data);
          });
        },
      },
    });
  }

  async handleDeleteBoard() {
    this.dialog.open(ConfirmModalComponent, {
      width: '500px',
      data: {
        title: 'Confirmation',
        message:
          'This will permanently delete the board and all related content. Are you sure you want to do this?',
        handleConfirm: async () => {
          const board = await this.boardService.remove(this.boardID);
          if (board) {
            this.dialogRef.close();
            this.router.navigate(['project/' + this.project.projectID]);
            await this.data.update(board, true);
          }
        },
      },
    });
  }

  resetColor() {
    this.newTagColor = TAG_DEFAULT_COLOR;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  openVoteDeleteDialog() {
    this.dialog.open(ConfirmModalComponent, {
      width: '500px',
      data: {
        title: 'Confirmation',
        message: 'Are you sure you want to clear all votes from the board?',
        handleConfirm: async () => {
          await this.upvoteService.removeByBoard(this.boardID);
        },
      },
    });
  }

  async copyConfiguration() {
    let boards = await this.boardService.getMultipleBy(this.project.boards, {
      scope: BoardScope.PROJECT_PERSONAL,
    });
    boards = boards.filter((b) => {
      if (this.isTeacherPersonalBoard) {
        return this.project.teacherIDs.includes(b.ownerID);
      } else {
        return !this.project.teacherIDs.includes(b.ownerID);
      }
    });

    await this.boardService.copyConfiguration(
      this.boardID,
      boards.map((b) => b.boardID)
    );
  }
}
