import { DELETE } from '@angular/cdk/keycodes';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PostModalComponent } from 'src/app/components/post-modal/post-modal.component';
import { Board } from 'src/app/models/board';
import Like from 'src/app/models/like';
import Post from 'src/app/models/post';
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

@Component({
  selector: 'app-html-post',
  templateUrl: './html-post.component.html',
  styleUrls: ['./html-post.component.scss']
})
export class HtmlPostComponent implements OnInit, OnDestroy {

  @Input() post: Post
  @Output() movePostToBoardEvent = new EventEmitter<string>();

  exists: boolean = true

  user: User
  board: Board

  numComments: number = 0
  numLikes: number = 0
  postColor: string;

  isLiked: Like | null

  showUsername: boolean = false

  unsubPosts: Function
  unsubBucket: Function

  postAuthor: User | undefined
  
  constructor(public commentService: CommentService, public likesService: LikesService, public postService: PostService,
    public authService: AuthService, public userSevice: UserService, public canvasService: CanvasService, 
    public boardService: BoardService, public dialog: MatDialog) { }

  ngOnInit(): void {
    this.user = this.authService.userData;
    this.postColor = POST_COLOR;
    this.configurePost()
  }

  configurePost() {
    this.commentService.getCommentsByPost(this.post.postID).then(data => this.numComments = data.length)
    this.likesService.getLikesByPost(this.post.postID).then(data => {
      this.numLikes = data.length;
      let foundLike = data.find(like => like.likerID == this.user.id)
      this.isLiked = foundLike ?? null;
    })
    this.boardService.get(this.post.boardID).then(board => {
      this.board = board
      this.listenForUpdatesIfNot()
      this.setUsernameAnonymity(board)
    })
    this.userSevice.getOneById(this.post.userID)
      .then(user =>{
        this.postAuthor = user
      })
  }

  openPostDialog() {
    this.dialog.open(PostModalComponent, {
      minWidth: '700px',
      width: 'auto',
      data: { 
        user: this.user, 
        post: this.post, 
        board: this.board
      }
    })
  }

  handleLike() {
    if (this.isLiked) {
      this.canvasService.unlike(this.isLiked);
      this.isLiked = null;
      this.numLikes -= 1;
    } else {
      const like: Like = {
        likeID: Date.now() + '-' + this.user.id,
        likerID: this.user.id,
        postID: this.post.postID,
        boardID: this.board.boardID
      }
      this.canvasService.like(like);
      this.isLiked = like
      this.numLikes += 1
    }
  }

  listenForUpdatesIfNot() {
    if (!this.unsubBucket && !this.unsubPosts) {
      this.unsubPosts = this.postService.observeOne(this.post.postID, this.handleUpdate, this.handleDelete);
      this.unsubBucket = this.boardService.subscribe(this.board.boardID, this.handleBoardChange);
    }
  }

  handleUpdate = (post) => {
    this.post = post
    this.configurePost()
  }

  handleDelete = (_post) => {
    this.exists = false
  }

  handleBoardChange = (board: Board) => {
    this.setUsernameAnonymity(board)
  }

  setUsernameAnonymity(board) {
    const permissions = board.permissions
    const isStudent = this.user.role == Role.STUDENT
    const isTeacher = this.user.role == Role.TEACHER
    const showUsernameForStudent = permissions.showAuthorNameStudent
    const showUsernameForTeacher = permissions.showAuthorNameTeacher

    if (isStudent && showUsernameForStudent) {
      this.showUsername = true
    } else if (isTeacher && showUsernameForTeacher) {
      this.showUsername = true
    } else {
      this.showUsername = false
    }
  }
  movePostToBoard(postID:string){
    this.movePostToBoardEvent.next(postID)
  }

  ngOnDestroy(): void {
    if(this.unsubPosts){
      this.unsubPosts()
    }
    if(this.unsubBucket){
      this.unsubBucket()
    }
    
  }
}
