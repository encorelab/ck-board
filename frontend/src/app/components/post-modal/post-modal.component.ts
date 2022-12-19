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
import Post, {
  ContentType,
  MultipleChoiceOptions,
  PostType,
} from 'src/app/models/post';
import { DELETE } from '@angular/cdk/keycodes';
import { SocketEvent } from 'src/app/utils/constants';
import { POST_COLOR } from 'src/app/utils/constants';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { SocketService } from 'src/app/services/socket.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { UserService } from 'src/app/services/user.service';
import { generateUniqueID, getErrorMessage } from 'src/app/utils/Utils';
import { Tag } from 'src/app/models/tag';
import { AddPostComponent } from '../add-post-modal/add-post.component';
import Upvote from 'src/app/models/upvote';
import { Board } from 'src/app/models/board';
import { BoardService } from 'src/app/services/board.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { Project } from 'src/app/models/project';
import { ProjectService } from 'src/app/services/project.service';

const linkifyStr = require('linkifyjs/lib/linkify-string');

export enum PostModalEvent {
  POST_UPVOTE = 'POST_UPVOTE',
  POST_DOWNVOTE = 'POST_DOWNVOTE',
  POST_ADD_COMMENT = 'POST_ADD_COMMENT',
  POST_REMOVE_COMMENT = 'POST_REMOVE_COMMENT',
  POST_ADD_TAG = 'POST_ADD_TAG',
  POST_REMOVE_TAG = 'POST_REMOVE_TAG',
}

export class PostModalData {
  post!: Post;
  user!: User;
  board!: Board;
  commentPress?: boolean;
  eventHandlers?: Map<PostModalEvent, Function>;
}

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
  contentType: ContentType;
  multipleChoiceOptions: MultipleChoiceOptions[] | undefined = [];
  selectedMultipleChoice: MultipleChoiceOptions;
  isMultipleChoiceSelected = false;
  submitMultipleChoiceAnswer = false;

  PostType: typeof PostType = PostType;

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
  descControl = new FormControl('', [Validators.maxLength(2000)]);
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
    public socketService: SocketService,
    public projectService: ProjectService,
    public canvasService: CanvasService,
    public userService: UserService,
    public fabricUtils: FabricUtils,
    public snackbarService: SnackbarService,
    public boardService: BoardService,
    @Inject(MAT_DIALOG_DATA) public data: PostModalData
  ) {
    dialogRef.backdropClick().subscribe(() => this.close());
    this.user = data.user;
    this.contentType = data.post.contentType;
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
      this.contentType = p.contentType;
      if (this.contentType === ContentType.MULTIPLE_CHOICE) {
        this.multipleChoiceOptions = p.multipleChoice;
      }
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
    if (this.contentType === ContentType.MULTIPLE_CHOICE) {
      this.editMultipleChoicePost();
    } else {
      this.isEditing = !this.isEditing;
    }
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
      contentType: this.contentType,
      multipleChoice: this.multipleChoiceOptions,
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
    };
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

  answerMultipleChoice() {
    this.submitMultipleChoiceAnswer = true;
    if (this.isMultipleChoiceSelected && this.selectedMultipleChoice) {
      if (this.selectedMultipleChoice.correct) {
        this.snackbarService.queueSnackbar('Correct Answer!');
      } else {
        this.snackbarService.queueSnackbar('Incorrect, please try again.');
      }
    }
  }
  selectMultipleChoice(event, multipleChoice) {
    event.stopPropagation();
    this.submitMultipleChoiceAnswer = false;
    this.isMultipleChoiceSelected = true;
    this.selectedMultipleChoice = multipleChoice;
  }

  async editMultipleChoicePost() {
    this.dialog.open(AddPostComponent, {
      width: '800px',
      autoFocus: false,
      data: {
        type: this.post.type,
        board: await this.boardService.get(this.post.boardID),
        user: this.user,
        spawnPosition: {
          top: this.post.displayAttributes?.position?.top
            ? this.post.displayAttributes?.position.top
            : 150,
          left: this.post.displayAttributes?.position?.left
            ? this.post.displayAttributes?.position.top
            : 150,
        },
        editingPost: this.post,
        onComplete: async (post: Partial<Post>) => {
          this.socketService.emit(SocketEvent.POST_UPDATE, post);
          if (post.title) {
            this.title = post.title;
            this.post.title = post.title;
            this.editingTitle = linkifyStr(post.title, {
              defaultProtocol: 'https',
              target: '_blank',
            });
          }
          if (post.tags) this.tags = post.tags;
          if (post.multipleChoice)
            this.multipleChoiceOptions = post.multipleChoice;
        },
      },
    });
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
