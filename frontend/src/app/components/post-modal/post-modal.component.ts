import { Component, Inject } from '@angular/core';
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
import { LikesService } from 'src/app/services/likes.service';
import Like from 'src/app/models/like';
import { PostService } from 'src/app/services/post.service';
import { BucketService } from 'src/app/services/bucket.service';
import { FabricUtils } from 'src/app/utils/FabricUtils';
import Post, { Tag } from 'src/app/models/post';
import { DELETE } from '@angular/cdk/keycodes';
import { SocketEvent } from 'src/app/utils/constants';
import { POST_COLOR } from 'src/app/utils/constants';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { SocketService } from 'src/app/services/socket.service';
import { CanvasService } from 'src/app/services/canvas.service';
import { UserService } from 'src/app/services/user.service';
import Utils from 'src/app/utils/Utils';

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

  titleControl = new FormControl('', [
    Validators.required,
    Validators.maxLength(50),
  ]);
  descControl = new FormControl('', [Validators.maxLength(1000)]);
  matcher = new MyErrorStateMatcher();

  newComment: string;
  comments: Comment[] = [];

  isLiked: Like | null;
  likes: Like[] = [];

  constructor(
    public dialogRef: MatDialogRef<PostModalComponent>,
    public dialog: MatDialog,
    public commentService: CommentService,
    public likesService: LikesService,
    public postService: PostService,
    public bucketService: BucketService,
    public socketService: SocketService,
    public canvasService: CanvasService,
    public userService: UserService,
    public fabricUtils: FabricUtils,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    dialogRef.backdropClick().subscribe(() => this.close());
    this.user = data.user;
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
        this.data.post.authorID == this.user.userID ||
        this.user.role == Role.TEACHER;
      this.author = await this.userService.getOneById(p.userID);
    });
    this.commentService.getCommentsByPost(data.post.postID).then((data) => {
      data.forEach((comment) => {
        this.comments.push(comment);
      });
    });
    this.likesService.getLikesByPost(data.post.postID).then((data) => {
      data.forEach((like) => {
        if (like.likerID == this.user.userID) this.isLiked = like;
        this.likes.push(like);
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
    this.editingDesc = this.desc;

    let obj: any = this.fabricUtils.getObjectFromId(this.post.postID);
    const update: Partial<Post> = {
      postID: this.post.postID,
      title: this.title,
      desc: this.desc,
    };

    // check if post is on board
    if (obj) {
      obj = this.fabricUtils.updatePostTitleDesc(obj, this.title, this.desc);
      obj.set({ title: this.title, desc: this.desc });
      this.fabricUtils._canvas.renderAll();
      update.fabricObject = this.fabricUtils.toJSON(obj);
    }

    this.socketService.emit(SocketEvent.POST_UPDATE, update);
    this.toggleEdit();
  }

  onDelete() {
    this.dialog.open(ConfirmModalComponent, {
      width: '500px',
      data: {
        title: 'Confirmation',
        message: 'Are you sure you want to permanently delete this post?',
        handleConfirm: () => {
          this.socketService.emit(SocketEvent.POST_DELETE, this.post);

          const obj = this.fabricUtils.getObjectFromId(this.post.postID);
          if (obj && obj.type == 'group') {
            this.fabricUtils._canvas.remove(obj);
            this.fabricUtils._canvas.renderAll();
          }
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
      commentID: Utils.generateUniqueID(),
      userID: this.data.user.userID,
      postID: this.post.postID,
      boardID: this.data.board.boardID,
      author: this.data.user.username,
    };

    this.canvasService.comment(comment);
    this.newComment = '';
    this.comments.push(comment);
  }

  handleLikeClick() {
    // if liking is locked just return (do nothing)
    if (
      this.user.role == Role.STUDENT &&
      !this.data.board.permissions.allowStudentLiking
    ) {
      return;
    }

    if (this.isLiked) {
      this.canvasService.unlike(this.user.userID, this.post.postID);
      this.isLiked = null;
      this.likes = this.likes.filter(
        (like) => like.likerID != this.user.userID
      );
    } else {
      const like: Like = {
        likeID: Utils.generateUniqueID(),
        likerID: this.user.userID,
        postID: this.post.postID,
        boardID: this.data.board.boardID,
      };
      this.canvasService.like(like);
      this.isLiked = like;
      this.likes.push(like);
    }
  }
}
