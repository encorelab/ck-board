import { DELETE } from '@angular/cdk/keycodes';
import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PostModalComponent } from 'src/app/components/post-modal/post-modal.component';
import { Board } from 'src/app/models/board';
import Like from 'src/app/models/like';
import Post from 'src/app/models/post';
import User from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';
import { BoardService } from 'src/app/services/board.service';
import { CommentService } from 'src/app/services/comment.service';
import { LikesService } from 'src/app/services/likes.service';
import { PostService } from 'src/app/services/post.service';
import { Role } from 'src/app/utils/constants';

@Component({
  selector: 'app-bucket-post',
  templateUrl: './bucket-post.component.html',
  styleUrls: ['./bucket-post.component.scss']
})
export class BucketPostComponent implements OnInit {

  @Input() post: Post

  exists: boolean = true

  user: User
  board: Board

  numComments: number = 0
  numLikes: number = 0

  isLiked: Like | null

  showUsername: boolean = false
  
  constructor(public commentService: CommentService, public likesService: LikesService, public postService: PostService,
    public authService: AuthService, public boardService: BoardService, public dialog: MatDialog) { }

  ngOnInit(): void {
    this.user = this.authService.userData;
    this.configurePost()
  }

  configurePost() {
    this.commentService.getCommentsByPost(this.post.postID).then(data => this.numComments = data.docs.length)
    this.likesService.getLikesByPost(this.post.postID).then(data => {
      this.numLikes = data.docs.length
      let foundLike = data.docs.find(like => like.data().likerID == this.user.id)
      this.isLiked = foundLike ? foundLike.data() : null
    })
    this.boardService.get(this.post.boardID).then(board => {
      this.board = board
      this.listenForUpdates()
      this.setUsernameAnonymity(board)
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
      this.likesService.remove(this.isLiked.likeID).then(() => {
        this.isLiked = null
        this.numLikes -= 1
      })
    } else {
      const like: Like = {
        likeID: Date.now() + '-' + this.user.id,
        likerID: this.user.id,
        postID: this.post.postID,
        boardID: this.board.boardID
      }
      this.likesService.add(like)
      this.numLikes += 1
      this.isLiked = like
    }
  }

  listenForUpdates() {
    this.postService.observeOne(this.post.postID, this.handleUpdate, this.handleDelete);
    this.boardService.observable(this.board.boardID, this.handleBoardChange);
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
}
