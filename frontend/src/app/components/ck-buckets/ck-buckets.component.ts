import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Board, ViewType } from 'src/app/models/board';
import { PostType } from 'src/app/models/post';
import { Project } from 'src/app/models/project';
import { AuthUser } from 'src/app/models/user';
import { BoardService } from 'src/app/services/board.service';
import { CommentService } from 'src/app/services/comment.service';
import { PostService } from 'src/app/services/post.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { UpvotesService } from 'src/app/services/upvotes.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-ck-buckets',
  templateUrl: './ck-buckets.component.html',
  styleUrls: ['./ck-buckets.component.scss'],
})
export class CkBucketsComponent implements OnInit {
  boardID: string;
  projectID: string;

  user: AuthUser;
  board: Board;
  project: Project;
  ViewType: typeof ViewType = ViewType;

  upvoteCounter = 0;

  constructor(
    public postService: PostService,
    public boardService: BoardService,
    public userService: UserService,
    public commentService: CommentService,
    public upvotesService: UpvotesService,
    public snackbarService: SnackbarService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  async ngOnInit(): Promise<void> {
    this.user = this.userService.user!;
    await this.configureBoard();
  }

  async ngOnDestroy() {
    this.snackbarService.ngOnDestroy();
  }

  async configureBoard(): Promise<void> {
    const map = this.activatedRoute.snapshot.paramMap;
    if (map.has('boardID') && map.has('projectID')) {
      this.boardID = this.activatedRoute.snapshot.paramMap.get('boardID') ?? '';
      this.projectID =
        this.activatedRoute.snapshot.paramMap.get('projectID') ?? '';
      this.postService.getAllByBoard(this.boardID).then((data) => {
        data.forEach(async (post) => {
          if (post.type == PostType.BOARD) {
            const upvotes = await this.upvotesService.getUpvotesByPost(
              post.postID
            );
            const comments = await this.commentService.getCommentsByPost(
              post.postID
            );
          }
        });
        this.boardService.get(this.boardID).then((board) => {
          if (board) this.intermediateBoardConfig(board);
        });
      });
    }
  }

  intermediateBoardConfig(board: Board) {
    this.board = board;
    this._calcUpvoteCounter();
  }

  signOut(): void {
    this.userService.logout();
    this.router.navigate(['login']);
  }

  private _calcUpvoteCounter() {
    this.upvotesService
      .getByBoardAndUser(this.boardID, this.user.userID)
      .then((votes) => {
        this.upvoteCounter = this.board.upvoteLimit - votes.length;
      });
  }
}
