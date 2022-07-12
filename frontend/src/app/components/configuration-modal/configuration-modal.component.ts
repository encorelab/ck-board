import { Component, Inject, ViewChild, TemplateRef } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { BoardService } from 'src/app/services/board.service';
import { UserService } from 'src/app/services/user.service';
import { UpvotesService } from 'src/app/services/upvotes.service';
import { FileUploadService } from 'src/app/services/fileUpload.service';
import { Tag } from 'src/app/models/tag';
import { TAG_DEFAULT_COLOR } from 'src/app/utils/constants';
import { CanvasService } from 'src/app/services/canvas.service';
import { Board, BoardPermissions } from 'src/app/models/board';
import { generateUniqueID } from 'src/app/utils/Utils';
import { Router } from '@angular/router';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-configuration-modal',
  templateUrl: './configuration-modal.component.html',
  styleUrls: ['./configuration-modal.component.scss'],
})
export class ConfigurationModalComponent {
  @ViewChild('confirmation') confirmationDialog: TemplateRef<any>;

  readonly tagDefaultColor = TAG_DEFAULT_COLOR;

  boardID: string;
  projectID: string;
  boardName: string;

  currentBgImage: any;
  newCompressedImage: any;

  taskTitle: string;
  taskMessage: string;

  permissions: BoardPermissions;

  tags: Tag[];
  newTagText = '';
  newTagColor: any = TAG_DEFAULT_COLOR;

  initialZoom = 100;
  upvoteLimit = 5;

  members: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<ConfigurationModalComponent>,
    private confirmationRef: MatDialogRef<TemplateRef<any>>,
    public dialog: MatDialog,
    public boardService: BoardService,
    public userService: UserService,
    public upvoteService: UpvotesService,
    public canvasService: CanvasService,
    public fileUploadService: FileUploadService,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.projectID = data.projectID;
    this.boardID = data.board.boardID;
    this.boardName = data.board.name;
    this.currentBgImage = data.board.bgImage;
    this.taskTitle = data.board.task.title;
    this.taskMessage = data.board.task.message;
    this.tags = data.board.tags ?? [];
    this.permissions = data.board.permissions;
    this.initialZoom = data.board.initialZoom;
    this.upvoteLimit = data.board.upvoteLimit;
    data.board.members.map((id) => {
      userService.getOneById(id).then((user) => {
        if (user) {
          this.members.push(user.username);
        }
      });
    });
  }

  addTag() {
    this.tags.push({
      tagID: generateUniqueID(),
      boardID: this.boardID,
      name: this.newTagText,
      color: this.newTagColor,
    });
    this.newTagText = '';
  }

  removeTag(tagRemove) {
    this.tags = this.tags.filter((tag) => tag != tagRemove);
  }

  compressFile() {
    this.fileUploadService.compressFile().then(async (compressedImage) => {
      this.newCompressedImage = compressedImage;

      const board = await this.canvasService.updateBoardImage(
        this.boardID,
        this.newCompressedImage
      );
      this.data.update(board);
    });
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
      this.boardName
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
    board = await this.canvasService.updateBoardTags(this.boardID, this.tags);
    board = await this.canvasService.updateBoardUpvotes(
      this.boardID,
      this.upvoteLimit
    );
    board = await this.boardService.update(this.boardID, {
      initialZoom: this.initialZoom,
    });
    this.data.update(board);
    this.dialogRef.close();
  }

  openConfirmation() {
    this.confirmationRef = this.dialog.open(this.confirmationDialog, {
      width: '550px',
    });
  }

  closeConfirmation() {
    this.confirmationRef.close();
  }

  async deleteBoard() {
    const board = await this.boardService.remove(this.boardID);
    if (board) {
      this.confirmationRef.close();
      this.dialogRef.close();
      this.router.navigate(['project/' + this.projectID]);
    }
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
        message: 'Are you sure you want to clear all upvotes from the board?',
        handleConfirm: async () => {
          await this.upvoteService.removeByBoard(this.boardID);
        },
      },
    });
  }

  copyToClipboard() {
    const url = window.location.href + '?embedded=true';
    navigator.clipboard.writeText(url);
  }
}
