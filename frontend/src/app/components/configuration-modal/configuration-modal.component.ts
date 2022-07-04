import { Component, Inject, ViewChild, TemplateRef } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { PostType } from '../../models/post';
import { BoardService } from 'src/app/services/board.service';
import { PostService } from '../../services/post.service';
import { UserService } from 'src/app/services/user.service';
import { FileUploadService } from 'src/app/services/fileUpload.service';
import { Tag } from 'src/app/models/tag';
import { TAG_DEFAULT_COLOR } from 'src/app/utils/constants';
import { CanvasService } from 'src/app/services/canvas.service';
import { Board, BoardPermissions } from 'src/app/models/board';
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

  members: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<ConfigurationModalComponent>,
    private confirmationRef: MatDialogRef<TemplateRef<any>>,
    public dialog: MatDialog,
    public postService: PostService,
    public boardService: BoardService,
    public userService: UserService,
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

  async handleClearBoard() {
    this.dialog.open(ConfirmModalComponent, {
      width: '500px',
      data: {
        title: 'Confirmation',
        message: 'Are you sure you want to clear posts from this board?',
        handleConfirm: () => {
          this.postService.getAllByBoard(this.boardID).then((data) => {
            data.forEach(async (post) => {
              if (post.type == PostType.BOARD) {
                const p = await this.postService.update(post.postID, { type: PostType.BOARD })
                console.log(p)
              }
            });
          })
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
            this.confirmationRef.close();
            this.dialogRef.close();
            this.router.navigate(['project/' + this.projectID]);
          }
        },
      },
    });
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
}
