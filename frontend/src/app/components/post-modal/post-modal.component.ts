import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import {
  MatLegacyDialog as MatDialog,
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
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
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { SocketService } from 'src/app/services/socket.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { UserService } from 'src/app/services/user.service';
import { generateUniqueID, getErrorMessage } from 'src/app/utils/Utils';
import { Tag } from 'src/app/models/tag';
import { AddPostComponent } from '../add-post-modal/add-post.component';
import Upvote from 'src/app/models/upvote';
import { Board, ViewType } from 'src/app/models/board';
import { BoardService } from 'src/app/services/board.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { Project } from 'src/app/models/project';
import { ProjectService } from 'src/app/services/project.service';
import Bucket from 'src/app/models/bucket';

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
  currentView?: ViewType;
  commentPress?: boolean;
  onCommentEvent?: Function;
  onTagEvent?: Function;
  onDeleteEvent?: Function;
  numSavedPosts: number = 0;
  updateNumSavedPosts?: Function;
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
  Role: typeof Role = Role;
  board: Board;
  project: Project;
  post: Post;
  author: User | undefined;
  buckets: any[];
  contentType: ContentType;
  multipleChoiceOptions: MultipleChoiceOptions[] | undefined = [];
  selectedMultipleChoice: MultipleChoiceOptions;
  isMultipleChoiceSelected = false;
  submitMultipleChoiceAnswer = false;

  numSavedPosts: number;

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
  titleControl = new UntypedFormControl('', [
    Validators.required,
    Validators.maxLength(50),
  ]);
  descControl = new UntypedFormControl('', [Validators.maxLength(2000)]);
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
    this.numSavedPosts = data.numSavedPosts;
    this.contentType = data.post.contentType;
    this.showComments = data?.commentPress ? true : false;
    this.postService.get(data.post.postID).then(async (p: Post) => {
      this.post = p;
      this.postColor = p.displayAttributes.fillColor;
      this.title = p.title;
      this.editingTitle = linkifyStr(p.title, {
        defaultProtocol: 'https',
        target: '_blank',
      });
      this.desc = p.desc;
      this.editingDesc = linkifyStr(p.desc, {
        defaultProtocol: 'https',
        target: '_blank',
      })
        .replace(/ /g, '&nbsp;') // Replace spaces with &nbsp;
        .replace(/\t/g, '&emsp;') // Replace tabs with &emsp;
        .replace(/(?:\r\n|\r|\n)/g, '<br>');
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
        this.buckets = buckets || [];
      });

    const isStudent = this.user.role == Role.STUDENT;
    const isTeacher = this.user.role == Role.TEACHER;
    this.showEditDelete =
      (isStudent && data.board.permissions.allowStudentEditAddDeletePost) ||
      (data.currentView && data.currentView != ViewType.CANVAS) ||
      isTeacher;
    this.canStudentComment =
      (isStudent && data.board.permissions.allowStudentCommenting) ||
      (data.currentView && data.currentView != ViewType.CANVAS) ||
      isTeacher;
    this.canStudentTag =
      (isStudent && data.board.permissions.allowStudentTagging) ||
      (data.currentView && data.currentView != ViewType.CANVAS) ||
      isTeacher;
    this.showAuthorName =
      (isStudent && data.board.permissions.showAuthorNameStudent) ||
      (isTeacher && data.board.permissions.showAuthorNameTeacher);
  }

  ngOnInit(): void {
    this.projectService.get(this.data.board.projectID).then((project) => {
      this.project = project;
    });
  }

  close(): void {
    this.dialogRef.close(this.post);
  }

  async updatePostContainer(
    event,
    destType: PostType,
    bucket: Bucket | null
  ): Promise<void> {
    if (destType == PostType.BOARD) {
      if (event.checked) {
        this.post = await this.canvasService.createBoardPostFromBucket(
          this.post
        );
      } else {
        this.post = (
          await this.canvasService.clearPostsFromBoard([this.post])
        )[0];
      }
    }
    if (destType == PostType.BUCKET && bucket) {
      const bucketID = bucket.bucketID;
      const postID = this.post.postID;
      if (event.checked) {
        bucket.posts.push(postID);
        await this.bucketService.add(bucketID, postID);
      } else {
        bucket.posts = bucket.posts.filter((id) => id !== postID);
        await this.bucketService.remove(bucketID, postID);
      }
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
    })
      .replace(/ /g, '&nbsp;') // Replace spaces with &nbsp;
      .replace(/\t/g, '&emsp;') // Replace tabs with &emsp;
      .replace(/(?:\r\n|\r|\n)/g, '<br>');

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
          if (this.data.onDeleteEvent) {
            this.data.onDeleteEvent(this.post.postID);
          }
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
    if (this.data.onTagEvent) {
      this.data.onTagEvent(this.post.postID, 'add');
    }
  }

  async removeTag(tag) {
    if (!this.canStudentTag) return;

    this.post = await this.canvasService.untag(this.post, tag);

    const index = this.tags.indexOf(tag);
    if (index >= 0) {
      this.tags.splice(index, 1);
    }
    this.tagOptions.push(tag);
    if (this.data.onTagEvent) {
      this.data.onTagEvent(this.post.postID, 'remove');
    }
  }

  async addComment() {
    const comment: Comment = {
      comment: this.newComment,
      commentID: generateUniqueID(),
      userID: this.data.user.userID,
      postID: this.post.postID,
      boardID: this.data.board.boardID,
      author: this.data.user.username,
    };

    await this.canvasService.comment(comment);
    this.newComment = '';
    this.comments.push(comment);
    if (this.data.onCommentEvent) {
      this.data.onCommentEvent(this.post.postID, 'add');
    }
  }

  async deleteComment(comment: Comment) {
    this.dialog.open(ConfirmModalComponent, {
      width: '500px',
      data: {
        title: 'Confirmation',
        message: 'Are you sure you want to delete this comment?',
        handleConfirm: async () => {
          await this.canvasService.deleteComment(
            comment.commentID,
            comment.postID
          );
          const ind = this.comments.indexOf(comment);
          if (ind != -1) {
            this.comments.splice(ind, 1);
          }
          if (this.data.onCommentEvent) {
            this.data.onCommentEvent(this.post.postID, 'remove');
          }
        },
      },
    });
  }

  async savePostToPersonalBoard() {
    try {
      const personalBoard = await this.boardService.getPersonal(
        this.project.projectID
      );

      if (!personalBoard) return;

      if (this.post.displayAttributes) {
        const postOffset = 50 * this.numSavedPosts;
        this.numSavedPosts += 1;
        if (this.data.updateNumSavedPosts)
          this.data.updateNumSavedPosts(this.numSavedPosts);
        const position = {
          top: this.canvasService.centerPos.top + postOffset,
          left: this.canvasService.centerPos.left + postOffset,
        };
        this.post.displayAttributes.position = position;
      }

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

      if (newPost)
        this.openSnackBar('Successfully copied to your Personal Board');
    } catch (error) {
      this.openSnackBar(
        'Unable to copy post to your Personal Board. Please refresh and try again!'
      );
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
        board: this.data.board,
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

  bucketIncludesPost(bucket: any): boolean {
    return (
      bucket.posts.findIndex((post) => post.postID == this.post.postID) > -1
    );
  }

  openSnackBar(message: string) {
    this.snackbarService.queueSnackbar(message);
  }

  private _votingLocked(): boolean {
    if (this.data.currentView) {
      return false;
    }
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
