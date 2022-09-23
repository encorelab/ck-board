import { T } from '@angular/cdk/keycodes';
import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Board, BoardType } from 'src/app/models/board';
import Bucket from 'src/app/models/bucket';
import Post, {
  DisplayAttributes,
  PostType,
  PostCreationType,
  MultipleChoiceOptions,
} from 'src/app/models/post';
import { Tag } from 'src/app/models/tag';
import User from 'src/app/models/user';
import { CanvasService } from 'src/app/services/canvas.service';
import {
  NEEDS_ATTENTION_TAG,
  POST_COLOR,
  POST_TAGGED_BORDER_THICKNESS,
} from 'src/app/utils/constants';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';
import { FabricUtils } from 'src/app/utils/FabricUtils';
import Utils, { generateUniqueID } from 'src/app/utils/Utils';

export interface AddPostDialog {
  type: PostType;
  user: User;
  board: Board;
  bucket?: Bucket;
  spawnPosition: { left: number; top: number };
  onComplete?: (post: any) => any;
  editingPost?: Post | undefined;
}

@Component({
  selector: 'app-dialog',
  templateUrl: './add-post.component.html',
  styleUrls: ['./add-post.component.scss'],
})
export class AddPostComponent {
  user: User;
  board: Board;
  boardType: BoardType;
  newMultipleChoiceOptionTest = '';
  multipleChoiceOptions: MultipleChoiceOptions[] = [];
  correctMultipleChoiceSelected = false;
  editingPost: Post | undefined;
  postCreationType: PostCreationType = PostCreationType.OPEN_RESPONSE_MESSAGE;

  title = '';
  message = '';

  tags: Tag[] = [];
  tagOptions: Tag[] = [];

  titleControl = new FormControl('', [
    Validators.required,
    Validators.maxLength(50),
  ]);
  msgControl = new FormControl('', [Validators.maxLength(1000)]);
  questionPromptControl = new FormControl('', [
    Validators.required,
    Validators.maxLength(1000),
  ]);

  matcher = new MyErrorStateMatcher();

  constructor(
    public canvasService: CanvasService,
    public fabricUtils: FabricUtils,
    public dialogRef: MatDialogRef<AddPostComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddPostDialog
  ) {
    this.user = data.user;
    this.board = data.board;
    this.boardType = data.board.type;
    this.editingPost = data.editingPost;
    if (this.editingPost) {
      this.postCreationType = PostCreationType.MULTIPLE_CHOICE;
      this.title = this.editingPost.title;
      this.multipleChoiceOptions = this.editingPost.multipleChoice
        ? this.editingPost.multipleChoice
        : [];
      this.tags = this.editingPost.tags;
      this.correctMultipleChoiceSelected = true;
    }
    this.tagOptions = data.board.tags.filter(
      (n) => !this.tags.map((b) => b.name).includes(n.name)
    );
  }

  addTag(event, tagOption): void {
    event.stopPropagation();
    this.tags.push(tagOption);
    this.tagOptions = this.tagOptions.filter((tag) => tag != tagOption);
  }

  removeTag(tag) {
    const index = this.tags.indexOf(tag);
    if (index >= 0) {
      this.tags.splice(index, 1);
    }

    this.tagOptions.push(tag);
  }

  addMultipleChoiceButton() {
    this.multipleChoiceOptions.push({
      optionTitle: this.newMultipleChoiceOptionTest,
      correct: false,
      formula: false,
    });
    this.newMultipleChoiceOptionTest = '';
  }

  removeMultipleChoiceOption(event, option) {
    event.stopPropagation();
    const index = this.multipleChoiceOptions.indexOf(option);

    if (index >= 0) {
      if (this.multipleChoiceOptions[index].correct)
        this.correctMultipleChoiceSelected = false;
      this.multipleChoiceOptions.splice(index, 1);
    }
  }

  multipleChoiceAnswer(event, option) {
    event.stopPropagation();
    this.correctMultipleChoiceSelected = true;
    const index = this.multipleChoiceOptions.indexOf(option);
    if (index >= 0) {
      this.multipleChoiceOptions[index].correct = true;
      for (let i = 0; i < this.multipleChoiceOptions.length; i++) {
        if (i != index) this.multipleChoiceOptions[i].correct = false;
      }
    }
  }
  disabled() {
    if (this.editingPost) {
      return (
        !this.titleControl.valid ||
        !this.msgControl.valid ||
        !(this.multipleChoiceOptions.length >= 2) ||
        !this.correctMultipleChoiceSelected ||
        !this.questionPromptControl.valid
      );
    } else if (this.postCreationType == PostCreationType.MULTIPLE_CHOICE) {
      return (
        !this.titleControl.valid ||
        !this.message ||
        !(this.multipleChoiceOptions.length >= 2) ||
        !this.correctMultipleChoiceSelected ||
        !this.questionPromptControl.valid
      );
    } else if (
      this.boardType === BoardType.QUESTION_AUTHORING &&
      this.postCreationType == PostCreationType.OPEN_RESPONSE_MESSAGE
    ) {
      return !this.titleControl.valid || !this.questionPromptControl.valid;
    } else {
      return !this.titleControl.valid || !this.msgControl.valid;
    }
  }

  async addPost() {
    const containsAttentionTag = this.tags.find(
      (tag) => tag.name == NEEDS_ATTENTION_TAG.name
    );

    const displayAttributes: DisplayAttributes = {
      position: {
        left: this.data.spawnPosition.left,
        top: this.data.spawnPosition.top,
      },
      lock: !this.board.permissions.allowStudentMoveAny,
      borderColor: containsAttentionTag ? NEEDS_ATTENTION_TAG.color : undefined,
      borderWidth: containsAttentionTag
        ? POST_TAGGED_BORDER_THICKNESS
        : undefined,
    };

    const post: Post = {
      postID: generateUniqueID(),
      userID: this.user.userID,
      boardID: this.board.boardID,
      type: PostType.BOARD,
      postCreationType: this.postCreationType,
      multipleChoice: this.multipleChoiceOptions,
      title: this.title,
      author: this.user.username,
      desc: this.message,
      tags: this.tags,
      displayAttributes: displayAttributes,
    };

    await this.canvasService.createPost(post);
    return post;
  }

  async addBucketPost() {
    const bucketID: string = this.data.bucket!.bucketID;
    const post: Post = {
      postID: generateUniqueID(),
      userID: this.user.userID,
      boardID: this.board.boardID,
      author: this.user.username,
      type: PostType.BUCKET,
      postCreationType: this.postCreationType,
      multipleChoice: this.multipleChoiceOptions,
      title: this.title,
      desc: this.message,
      tags: this.tags,
      displayAttributes: null,
    };

    return await this.canvasService.createBucketPost(bucketID, post);
  }

  async addListPost() {
    const post: Post = {
      postID: generateUniqueID(),
      userID: this.user.userID,
      boardID: this.board.boardID,
      author: this.user.username,
      type: PostType.LIST,
      postCreationType: this.postCreationType,
      multipleChoice: this.multipleChoiceOptions,
      title: this.title,
      desc: this.message,
      tags: this.tags,
      displayAttributes: null,
    };

    return await this.canvasService.createListPost(post);
  }

  async updateMultipleChoicePost() {
    if (this.editingPost) {
      const update: Partial<Post> = {
        postID: this.editingPost.postID,
        title: this.title,
        multipleChoice: this.multipleChoiceOptions,
        tags: this.tags,
      };
      if (this.data.onComplete) {
        this.data.onComplete(update);
      }
      this.dialogRef.close();
    }
  }

  async handleDialogSubmit() {
    let post: Post;

    if (this.data.type == PostType.BUCKET && this.data.bucket) {
      post = await this.addBucketPost();
    } else if (this.data.type == PostType.LIST) {
      post = await this.addListPost();
    } else {
      post = await this.addPost();
    }

    if (this.data.onComplete) {
      this.data.onComplete(post);
    }

    this.dialogRef.close();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
