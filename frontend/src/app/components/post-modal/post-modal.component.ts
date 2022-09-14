import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';
import Comment from 'src/app/models/comment';
import { CommentService } from 'src/app/services/comment.service';
import User, { Role } from 'src/app/models/user';
import { UpvotesService } from 'src/app/services/upvotes.service';
import { PostService } from 'src/app/services/post.service';
import { BucketService } from 'src/app/services/bucket.service';
import { FabricUtils } from 'src/app/utils/FabricUtils';
import Post, { PostType } from 'src/app/models/post';
import { DELETE } from '@angular/cdk/keycodes';
import { SocketEvent } from 'src/app/utils/constants';
import { POST_COLOR } from 'src/app/utils/constants';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { SocketService } from 'src/app/services/socket.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { UserService } from 'src/app/services/user.service';
import { generateUniqueID, getErrorMessage } from 'src/app/utils/Utils';
import { Tag } from 'src/app/models/tag';
import Upvote from 'src/app/models/upvote';
import { BoardService } from 'src/app/services/board.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { Project } from 'src/app/models/project';
import { ProjectService } from 'src/app/services/project.service';

const linkifyStr = require('linkifyjs/lib/linkify-string');

@Component({
  selector: 'app-post-modal',
  templateUrl: './post-modal.component.html',
  styleUrls: ['./post-modal.component.scss'],
})
export class PostModalComponent {
  tags: Tag[] = [];
  tagOptions: Tag[] = [];

  user: User;
  project: Project;
  post: Post;
  author: User | undefined;
  buckets: any[];

  title: string;
  editingTitle: string;
  desc: string;
  editingDesc: string;
  isEditing = false;
  canEditDelete: boolean;
  canStudentComment: boolean;
  canStudentTag: boolean;
  postColor: string;
  showComments = false;
  showEditDelete = false;
  showAuthorName: boolean;

  error = '';
  titleControl = new FormControl('', [
    Validators.required,
    Validators.maxLength(50),
  ]);
  descControl = new FormControl('', [Validators.maxLength(1000)]);
  matcher = new MyErrorStateMatcher();

  newComment: string;
  comments: Comment[] = [];

  upvotes: Upvote[] = [];

  expandedUpvotesView = false;
  expandedUpvotes: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<PostModalComponent>,
    public dialog: MatDialog,
    public commentService: CommentService,
    public upvotesService: UpvotesService,
    public postService: PostService,
    public bucketService: BucketService,
    public boardService: BoardService,
    public snackbarService: SnackbarService,
    public socketService: SocketService,
    public projectService: ProjectService,
    public canvasService: CanvasService,
    public userService: UserService,
    public fabricUtils: FabricUtils,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    dialogRef.backdropClick().subscribe(() => this.close());
    this.user = data.user;
    this.showComments = data?.commentPress ? true : false;
    this.postService.get(data.post.postID).then(async (p: Post) => {
      this.post = p;
      this.title = p.title;
      this.editingTitle = linkifyStr(p.title, {
        defaultProtocol: 'https',
        target: '_blank',
      });
      this.desc = p.desc;
      this.editingDesc = linkifyStr(p.desc, {
        defaultProtocol: 'https',
        target: '_blank',
      });
      this.tags = p.tags;
      this.tagOptions = data.board.tags.filter(
        (n) => !this.tags.map((b) => b.name).includes(n.name)
      );
      this.canEditDelete =
        this.data.post.userID == this.user.userID ||
        this.user.role == Role.TEACHER;
      this.author = await this.userService.getOneById(p.userID);
    });
    this.commentService.getCommentsByPost(data.post.postID).then((data) => {
      data.forEach((comment) => {
        this.comments.push(comment);
      });
    });
    this.upvotesService.getUpvotesByPost(data.post.postID).then((data) => {
      data.forEach((upvote) => {
        this.upvotes.push(upvote);
      });
    });
    this.bucketService
      .getAllByBoard(this.data.board.boardID)
      .then((buckets) => {
        this.buckets = [];
        buckets.forEach((bucket) => {
          bucket.includesPost = bucket.posts.some(
            (post) => post.postID == this.post.postID
          );
          this.buckets.push(bucket);
        });
      });

    const isStudent = this.user.role == Role.STUDENT;
    const isTeacher = this.user.role == Role.TEACHER;
    this.showEditDelete =
      (isStudent && data.board.permissions.allowStudentEditAddDeletePost) ||
      isTeacher;
    this.canStudentComment =
      (isStudent && data.board.permissions.allowStudentCommenting) || isTeacher;
    this.canStudentTag =
      (isStudent && data.board.permissions.allowStudentTagging) || isTeacher;
    this.showAuthorName =
      (isStudent && data.board.permissions.showAuthorNameStudent) ||
      (isTeacher && data.board.permissions.showAuthorNameTeacher);
    this.postColor = POST_COLOR;
  }

  ngOnInit(): void {
    this.projectService.get(this.data.board.projectID).then((project) => {
      this.project = project;
    });
  }

  close(): void {
    this.dialogRef.close(this.post);
  }

  updateBucket(event) {
    const bucketID = event.source.id;
    const bucket: any = this.buckets.find(
      (bucket) => bucket.bucketID === bucketID
    );

    if (event.checked) {
      bucket.posts.push(this.post);
      this.bucketService.add(bucketID, this.post.postID);
    } else {
      bucket.posts = bucket.posts.filter(
        (post) => post.postID !== this.post.postID
      );
      this.bucketService.remove(bucketID, this.post.postID);
    }
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  toggleComments() {
    this.showComments = !this.showComments;
  }

  async onUpdate() {
    this.editingTitle = this.title;
    this.editingDesc = linkifyStr(this.desc, {
      defaultProtocol: 'https',
      target: '_blank',
    });

    const update: Partial<Post> = {
      postID: this.post.postID,
      title: this.title,
      desc: this.desc,
    };

    this.socketService.emit(SocketEvent.POST_UPDATE, update);
    this.toggleEdit();
  }

  onDelete() {
    this.dialog.open(ConfirmModalComponent, {
      width: '500px',
      data: {
        title: 'Confirmation',
        message: 'Are you sure you want to permanently delete this post?',
        handleConfirm: async () => {
          await this.canvasService.removePost(this.post);
          this.dialogRef.close(DELETE);
        },
      },
    });
  }

  async addTag(event, tagOption) {
    event.stopPropagation();

    this.post = await this.canvasService.tag(this.post, tagOption);
    this.tags.push(tagOption);
    this.tagOptions = this.tagOptions.filter((tag) => tag != tagOption);
  }

  async removeTag(tag) {
    if (!this.canStudentTag) return;

    this.post = await this.canvasService.untag(this.post, tag);

    const index = this.tags.indexOf(tag);
    if (index >= 0) {
      this.tags.splice(index, 1);
    }
    this.tagOptions.push(tag);
  }

  addComment() {
    const comment: Comment = {
      comment: this.newComment,
      commentID: generateUniqueID(),
      userID: this.data.user.userID,
      postID: this.post.postID,
      boardID: this.data.board.boardID,
      author: this.data.user.username,
    };

    this.canvasService.comment(comment);
    this.newComment = '';
    this.comments.push(comment);
  }

  async deleteComment(comment: Comment) {
    this.dialog.open(ConfirmModalComponent, {
      width: '500px',
      data: {
        title: 'Confirmation',
        message: 'Are you sure you want to delete this comment?',
        handleConfirm: () => {
          this.canvasService.deleteComment(comment.commentID, comment.postID);
          const ind = this.comments.indexOf(comment);
          if (ind != -1) {
            this.comments.splice(ind, 1);
          }
        },
      },
    });
  }

  async savePostToPersonalBoard() {
    const personalBoard = await this.boardService.getPersonal(
      this.project.projectID
    );

    if (!personalBoard) return;

    const post: Post = {
      postID: generateUniqueID(),
      userID: this.user.userID,
      boardID: personalBoard.boardID,
      type: PostType.BOARD,
      title: this.title,
      author: this.user.username,
      desc: this.desc,
      tags: this.tags,
      displayAttributes: this.post.displayAttributes,
    };

    const newPost = await this.postService.create(post);

    const postInput = {
      originalPostID: this.post.postID,
      newPostID: newPost.postID,
      personalBoardID: personalBoard.boardID,
    }
    if (newPost) {
      this.socketService.emit(SocketEvent.PERSONAL_BOARD_ADD_POST, postInput);
      this.openSnackBar('Successfully copied to your Personal Board');
    }
  }

  async handleUpvoteClick() {
    if (this._votingLocked())
      return this._setError(getErrorMessage('Voting is disabled!'));

    this.canvasService
      .upvote(this.user.userID, this.post)
      .then((upvote) => this.upvotes.push(upvote))
      .catch((e) => this._setError(getErrorMessage(e)));
  }

  async handleDownvoteClick() {
    if (this._votingLocked())
      return this._setError(getErrorMessage('Voting is disabled!'));

    this.canvasService
      .unupvote(this.user.userID, this.post.postID)
      .then((upvote: Upvote) => {
        this.upvotes = this.upvotes.filter(
          (u) => u.upvoteID != upvote.upvoteID
        );
      })
      .catch((e) => this._setError(getErrorMessage(e)));
  }

  isUpvoted(): Boolean {
    return this.upvotes.some((u) => u.voterID === this.user.userID);
  }

  async gotoUpvotesView() {
    this.expandedUpvotes = await this.upvotesService.getUpvotesByPost(
      this.post.postID,
      'grouped'
    );

    if (
      !this.expandedUpvotes ||
      Object.keys(this.expandedUpvotes).length == 0
    ) {
      return this._setError('No upvotes found!');
    }

    this.dialogRef.updateSize('30vw');
    this.expandedUpvotesView = true;
  }

  gotoPostView() {
    this.dialogRef.updateSize('95vw');
    this.expandedUpvotesView = false;
  }

  openSnackBar(message: string) {
    this.snackbarService.queueSnackbar(message);
  }

  private _votingLocked(): boolean {
    return (
      this.user.role == Role.STUDENT &&
      !this.data.board.permissions.allowStudentUpvoting
    );
  }

  private _setError(error: string) {
    this.error = error;
    setTimeout(() => (this.error = ''), 5000);
  }
}
