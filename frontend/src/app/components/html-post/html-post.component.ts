import { DELETE } from '@angular/cdk/keycodes';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PostModalComponent } from 'src/app/components/post-modal/post-modal.component';
import { Board } from 'src/app/models/board';
import Like from 'src/app/models/like';
import Post from 'src/app/models/post';
import { Tag } from 'src/app/models/tag';
import { AuthUser } from 'src/app/models/user';
import { BoardService } from 'src/app/services/board.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { CommentService } from 'src/app/services/comment.service';
import { LikesService } from 'src/app/services/likes.service';
import { PostService } from 'src/app/services/post.service';
import { SocketService } from 'src/app/services/socket.service';
import { UserService } from 'src/app/services/user.service';
import { SocketEvent } from 'src/app/utils/constants';
import { POST_COLOR } from 'src/app/utils/constants';
import Utils from 'src/app/utils/Utils';

export interface HTMLPost {
  /* Board which contains this post */
  board: Board;

  /* Associated post */
  post: Post;

  /* Author name */
  author: string;

  /* Array of user IDs who've liked the post */
  likes: string[];

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
  @Output() movePostToBoardEvent = new EventEmitter<string>();

  exists = true;

  user: AuthUser;

  postColor: string = POST_COLOR;

  isLiked = false;
  showUsername = false;

  constructor(
    public commentService: CommentService,
    public likesService: LikesService,
    public postService: PostService,
    public userService: UserService,
    public socketService: SocketService,
    public canvasService: CanvasService,
    public boardService: BoardService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.user = this.userService.user!;
    this.isLiked = this.post.likes.includes(this.user.userID);
  }

  openPostDialog() {
    this.dialog
      .open(PostModalComponent, {
        minWidth: '700px',
        width: 'auto',
        data: {
          user: this.user,
          post: this.post.post,
          board: this.post.board,
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

  handleLike(event) {
    event.stopPropagation();

    if (this.isLiked) {
      this.canvasService.unlike(this.user.userID, this.post.post.postID);
      this.isLiked = false;
      this.post.likes = this.post.likes.filter(
        (like) => like !== this.user.userID
      );
    } else {
      const like: Like = {
        likeID: Utils.generateUniqueID(),
        likerID: this.user.userID,
        postID: this.post.post.postID,
        boardID: this.post.board.boardID,
      };
      this.canvasService.like(like);
      this.isLiked = true;
      this.post.likes.push(this.user.userID);
    }
  }

  movePostToBoard(postID: string) {
    this.movePostToBoardEvent.next(postID);
  }
}
