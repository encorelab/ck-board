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
import Post, { Tag } from 'src/app/models/post';
import User from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';
import { BoardService } from 'src/app/services/board.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { CommentService } from 'src/app/services/comment.service';
import { LikesService } from 'src/app/services/likes.service';
import { PostService } from 'src/app/services/post.service';
import { SocketService } from 'src/app/services/socket.service';
import { UserService } from 'src/app/services/user.service';
import { Role, SocketEvent } from 'src/app/utils/constants';
import { POST_COLOR } from 'src/app/utils/constants';

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

  exists: boolean = true;

  user: User;

  postColor: string = POST_COLOR;

  isLiked: boolean = false;
  showUsername: boolean = false;

  constructor(
    public commentService: CommentService,
    public likesService: LikesService,
    public postService: PostService,
    public authService: AuthService,
    public userSevice: UserService,
    public socketService: SocketService,
    public canvasService: CanvasService,
    public boardService: BoardService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.user = this.authService.userData;
    this.isLiked = this.post.likes.includes(this.user.id);
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
      .subscribe(async () => {
        this.post.post = await this.postService.get(this.post.post.postID);
      });
  }

  handleLike(event) {
    event.stopPropagation();

    if (this.isLiked) {
      this.canvasService.unlike(this.user.id, this.post.post.postID);
      this.isLiked = false;
      this.post.likes = this.post.likes.filter((like) => like !== this.user.id);
    } else {
      const like: Like = {
        likeID: Date.now() + '-' + this.user.id,
        likerID: this.user.id,
        postID: this.post.post.postID,
        boardID: this.post.board.boardID,
      };
      this.canvasService.like(like);
      this.isLiked = true;
      this.post.likes.push(this.user.id);
    }
  }

  handleDelete = (_post) => {
    this.exists = false;
  };

  movePostToBoard(postID: string) {
    this.movePostToBoardEvent.next(postID);
  }
}
