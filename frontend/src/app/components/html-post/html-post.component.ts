import { DELETE } from '@angular/cdk/keycodes';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PostModalComponent } from 'src/app/components/post-modal/post-modal.component';
import { Board } from 'src/app/models/board';
import Post from 'src/app/models/post';
import { AuthUser } from 'src/app/models/user';
import { BoardService } from 'src/app/services/board.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { CommentService } from 'src/app/services/comment.service';
import { UpvotesService } from 'src/app/services/upvotes.service';
import { PostService } from 'src/app/services/post.service';
import { SocketService } from 'src/app/services/socket.service';
import { UserService } from 'src/app/services/user.service';
import { POST_COLOR } from 'src/app/utils/constants';
import { getErrorMessage } from 'src/app/utils/Utils';
import Upvote from 'src/app/models/upvote';

export interface HTMLPost {
  /* Board which contains this post */
  board: Board;

  /* Associated post */
  post: Post;

  /* Author name */
  author: string;

  /* Array of post's upvotes */
  upvotes: Upvote[];

  /* Number of comments */
  comments: number;

  /* If post is only stored in a bucket */
  bucketOnly?: boolean;

  /* Display author's name as 'Anonymous' */
  hideAuthorName?: boolean;
}

@Component({
  selector: 'app-html-post',
  templateUrl: './html-post.component.html',
  styleUrls: ['./html-post.component.scss'],
})
export class HtmlPostComponent implements OnInit {
  @Input() post: HTMLPost;
  @Input() disableDownload: boolean = false;
  @Output() movePostToBoardEvent = new EventEmitter<string>();

  exists = true;

  user: AuthUser;

  postColor: string = POST_COLOR;

  showUsername = false;

  error = '';

  constructor(
    public commentService: CommentService,
    public upvotesService: UpvotesService,
    public postService: PostService,
    public userService: UserService,
    public socketService: SocketService,
    public canvasService: CanvasService,
    public boardService: BoardService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.user = this.userService.user!;
  }

  openPostDialog(commentPress = false) {
    this.dialog
      .open(PostModalComponent, {
        minWidth: '700px',
        width: 'auto',
        data: {
          user: this.user,
          post: this.post.post,
          board: this.post.board,
          commentPress: commentPress,
        },
      })
      .afterClosed()
      .subscribe(async (value) => {
        if (value == DELETE) {
          this.exists = false;
        } else {
          this.post.post = await this.postService.get(this.post.post.postID);
        }
      });
    this.canvasService.readPost(this.post.post.postID);
  }

  async handleUpvote(event) {
    event.stopPropagation();

    this.canvasService
      .upvote(this.user.userID, this.post.post)
      .catch((e) => this.setError(getErrorMessage(e)));
  }

  async handleDownvote(event) {
    event.stopPropagation();

    this.canvasService
      .unupvote(this.user.userID, this.post.post)
      .catch((e) => this.setError(getErrorMessage(e)));
  }

  movePostToBoard(postID: string) {
    this.movePostToBoardEvent.next(postID);
  }

  isUpvoted(): Boolean {
    return this.post.upvotes.some((u) => u.voterID == this.user.userID);
  }

  setError(error: string) {
    this.error = error;
    setTimeout(() => (this.error = ''), 5000);
  }
}
