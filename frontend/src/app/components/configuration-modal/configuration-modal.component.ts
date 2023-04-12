import { Component, Inject, OnDestroy } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { BoardService } from 'src/app/services/board.service';
import { PostService } from '../../services/post.service';
import { UserService } from 'src/app/services/user.service';
import { UpvotesService } from 'src/app/services/upvotes.service';
import { FileUploadService } from 'src/app/services/fileUpload.service';
import { Tag } from 'src/app/models/tag';
import {
  TAG_DEFAULT_COLOR,
  POST_TAGGED_BORDER_THICKNESS,
  SocketEvent,
} from 'src/app/utils/constants';
import { CanvasService } from 'src/app/services/canvas.service';
import { Project } from 'src/app/models/project';
import { Board, BoardScope, BoardPermissions } from 'src/app/models/board';
import { generateUniqueID, getErrorMessage } from 'src/app/utils/Utils';
import { Router } from '@angular/router';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { ImageSettings } from 'src/app/utils/FabricUtils';
import { SocketService } from 'src/app/services/socket.service';
import { SnackbarService } from 'src/app/services/snackbar.service';

@Component({
  selector: 'app-configuration-modal',
  templateUrl: './configuration-modal.component.html',
  styleUrls: ['./configuration-modal.component.scss'],
})
export class ConfigurationModalComponent implements OnDestroy {
  readonly tagDefaultColor = TAG_DEFAULT_COLOR;

  project: Project;
  board: Board;

  boardID: string;
  boardName: string;
  questionAuthoringType: string;

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

  loading: boolean = false;

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
    private _snackbarService: SnackbarService,
    private _router: Router,
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
  }

  addTag(): void {
    this.tagsChanged = true;
    this.tags.push({
      tagID: generateUniqueID(),
      boardID: this.boardID,
      name: this.newTagText,
      color: this.newTagColor,
    });

    this.loading = true;
    this.boardService
      .update(this.boardID, { tags: this.tags })
      .then((board) => {
        this._snackbarService.queueSnackbar(
          `Sucessfully added tag to Board: ${board.name}`
        );
      })
      .catch((error) => {
        const errorMsg = getErrorMessage(error);
        console.error(errorMsg);
        this._snackbarService.queueSnackbar(
          'A problem occured while adding a tag. Please try again',
          `Error: ${errorMsg}`
        );
      })
      .finally(() => (this.loading = false));
    this.newTagText = '';
  }

  removeTag(tagRemove: Tag): void {
    this.tagsChanged = true;
    this.tags = this.tags.filter((tag) => tag != tagRemove);

    this.boardService
      .update(this.boardID, { tags: this.tags })
      .then((board) => {
        this._snackbarService.queueSnackbar(
          `Sucessfully removed tag from Board: ${board.name}`
        );
      })
      .catch((error) => {
        const errorMsg = getErrorMessage(error);
        console.error(errorMsg);
        this._snackbarService.queueSnackbar(
          'A problem occured while removing a tag. Please try again',
          `Error: ${errorMsg}`
        );
      });
  }

  compressFile(): void {
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

  updateBoardImageSettings(): Promise<Board> {
    this.bgImgSettings.top = this.backgroundPosY;
    this.bgImgSettings.left = this.backgroundPosX;
    this.bgImgSettings.scaleX = this.backgroundScale / 100;
    this.bgImgSettings.scaleY = this.backgroundScale / 100;

    return this.canvasService.updateBoardImageSettings(
      this.boardID,
      this.bgImgSettings
    );
  }

  removeImage(): void {
    this.currentBgImage = null;

    this.canvasService
      .updateBoardImage(this.boardID, null)
      .then((board) => {
        this.data.update(board);
      })
      .catch((error) => {
        const errorMsg = getErrorMessage(error);
        console.error(errorMsg);
        this._snackbarService.queueSnackbar(
          'A problem occured while removing the board image. Please try again',
          `Error: ${errorMsg}`
        );
      });
  }

  handleDialogSubmit(): void {
    this.loading = true;
    this.canvasService
      .updateBoardName(this.boardID, this.boardName.trim())
      .then(() => {
        return this.canvasService.updateBoardTask(
          this.boardID,
          this.taskTitle,
          this.taskMessage
        );
      })
      .then(() => {
        return this.canvasService.updateBoardPermissions(
          this.boardID,
          this.permissions
        );
      })
      .then(() => {
        return this.canvasService.updateBoardUpvotes(
          this.boardID,
          this.upvoteLimit
        );
      })
      .then((board) => {
        return this.currentBgImage
          ? this.updateBoardImageSettings()
          : Promise.resolve(board);
      })
      .then(() => {
        return this.boardService.update(this.boardID, {
          initialZoom: this.initialZoom,
        });
      })
      .then((board) => {
        this.data.update(board);
      })
      .catch((error) => {
        const errorMsg = getErrorMessage(error);
        console.error(errorMsg);
        this._snackbarService.queueSnackbar(
          'A problem occured while updating the board. Please try again',
          `Error: ${errorMsg}`
        );
      })
      .finally(() => {
        this.loading = false;
      });

    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    if (this.tagsChanged) {
      this.boardService.get(this.boardID).then((board) => {
        this.socketService.emit(SocketEvent.BOARD_TAGS_UPDATE, board);
      });
    }
  }

  handleClearBoard(): void {
    this.dialog.open(ConfirmModalComponent, {
      width: '500px',
      data: {
        title: 'Confirmation',
        message:
          'Are you sure you want to clear posts from this board? NOTE: Posts will be cleared from the board but remain in the the list view and any assigned buckets.',
        handleConfirm: async () => {
          this.postService.getAllByBoard(this.boardID).then(async (data) => {
            this.canvasService.clearPostsFromBoard(data);
          });
        },
      },
    });
  }

  handleDeleteBoard(): void {
    this.dialog.open(ConfirmModalComponent, {
      width: '500px',
      data: {
        title: 'Confirmation',
        message:
          'This will permanently delete the board and all related content. Are you sure you want to do this?',
        handleConfirm: () => {
          this.boardService.remove(this.boardID).then((board) => {
            this.dialogRef.close();
            this._router.navigate(['project/' + this.project.projectID]);
            this.data.update(board, true);
          });
        },
      },
    });
  }

  resetColor(): void {
    this.newTagColor = TAG_DEFAULT_COLOR;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  openVoteDeleteDialog(): void {
    this.dialog.open(ConfirmModalComponent, {
      width: '500px',
      data: {
        title: 'Confirmation',
        message: 'Are you sure you want to clear all votes from the board?',
        handleConfirm: () => {
          this.upvoteService.removeByBoard(this.boardID).then(() => {
            this._snackbarService.queueSnackbar(
              'Success! All votes have been cleared'
            );
          });
        },
      },
    });
  }

  copyConfiguration(): void {
    this.boardService
      .getMultipleBy(this.project.boards, {
        scope: BoardScope.PROJECT_PERSONAL,
      })
      .then((boards) => {
        boards = boards.filter((b) => {
          return this.isTeacherPersonalBoard
            ? this.project.teacherIDs.includes(b.ownerID)
            : !this.project.teacherIDs.includes(b.ownerID);
        });

        return this.boardService.copyConfiguration(
          this.boardID,
          boards.map((b) => b.boardID)
        );
      })
      .then(() => {
        this._snackbarService.queueSnackbar(
          'Success! Board configuration copied to all Personal Teacher Boards'
        );
      })
      .catch((error) => {
        const errorMsg = getErrorMessage(error);
        console.error(errorMsg);
        this._snackbarService.queueSnackbar(
          'A problem occured while updating the board. Please try again',
          `Error: ${errorMsg}`
        );
      });
  }
}
