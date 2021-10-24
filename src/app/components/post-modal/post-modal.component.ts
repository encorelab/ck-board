import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';
import Comment from 'src/app/models/comment';
import { CommentService } from 'src/app/services/comment.service';
import User from 'src/app/models/user';
import { LikesService } from 'src/app/services/likes.service';
import Like from 'src/app/models/like';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { PostService } from 'src/app/services/post.service';
import Post from 'src/app/models/post';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-post-modal',
  templateUrl: './post-modal.component.html',
  styleUrls: ['./post-modal.component.scss']
})
export class PostModalComponent {
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  tags: string[] = []
  tagOptions: string[] = []
  tagCtrl = new FormControl();
  filteredTagOptions: Observable<string[]>;

  user: User

  title: string
  desc: string
  isEditing: boolean = false
  canEditDelete: boolean
  showComments: boolean = false

  titleControl = new FormControl('', [Validators.required, Validators.maxLength(50)]);
  descControl = new FormControl('', [Validators.maxLength(1000)]);
  matcher = new MyErrorStateMatcher();
  
  newComment: string
  comments: Comment[] = []

  isLiked: Like | null
  likes: Like[] = []
  
  @ViewChild('tagInput') tagInput: ElementRef<HTMLInputElement>;

  constructor(
    public dialogRef: MatDialogRef<PostModalComponent>,
    public commentService: CommentService, public likesService: LikesService,
    public postsService: PostService,
    @Inject(MAT_DIALOG_DATA) public data: any) {
      this.user = data.user
      this.postsService.get(data.post.postID).then((item) => {
        item.forEach((post) => {
          var p = post.data()
          this.title = p.title
          this.desc = p.desc
          this.tags = p.tags
          this.tagOptions = data.board.tags.filter(n => !this.tags.includes(n))
          this.canEditDelete = this.data.post.userID == this.user.id || this.user.role == 'teacher'
        })
      })
      this.commentService.getCommentsByPost(data.post.postID).then((data) => {
        data.forEach((comment) => {
          this.comments.push(comment.data())
        })
      })
      this.likesService.getLikesByPost(data.post.postID).then((data) => {
        data.forEach((like) => {
          var likeObj = like.data()
          if (likeObj.likerID == this.user.id) this.isLiked = likeObj
          this.likes.push(likeObj)
        })
      })
      this.filteredTagOptions = this.tagCtrl.valueChanges.pipe(
        startWith(null),
        map((fruit: string | null) => fruit ? this._filter(fruit) : this.tagOptions.slice())
      );
  }
  
  onNoClick(): void {
    this.dialogRef.close();
  }

  toggleEdit() {
    this.isEditing = !this.isEditing
  }

  toggleComments() {
    this.showComments = !this.showComments
  }

  onUpdate() {
    this.data.updatePost(this.data.post.postID, this.title, this.desc)
    this.toggleEdit()
  }

  onDelete() {
    this.data.removePost(this.data.post.postID)
    this.dialogRef.close();
  }

  selectedTag(event: MatAutocompleteSelectedEvent): void {
    this.tags.push(event.option.viewValue);
    this.postsService.update(this.data.post.postID, { tags: this.tags })
    this.tagInput.nativeElement.value = '';
    this.tagCtrl.setValue(null);
  }

  addComment() {
    const comment: Comment = {
      comment: this.newComment,
      commentID: Date.now() + '-' + this.data.user.id,
      userID: this.data.user.id,
      postID: this.data.post.postID,
      boardID: this.data.board.boardID,
      author: this.data.user.username
    }
    this.commentService.add(comment).then(() => {
      this.newComment = ''
      this.comments.push(comment)
    }).catch((e) => console.log(e))
  }

  handleLikeClick() {
    if (this.isLiked) {
      this.likesService.remove(this.isLiked.likeID).then(() => {
        this.isLiked = null
        this.likes = this.likes.filter(like => like.likerID != this.user.id)
      })
    } else {
      const like: Like = {
        likeID: Date.now() + '-' + this.user.id,
        likerID: this.user.id,
        postID: this.data.post.postID,
        boardID: this.data.board.boardID
      }
      this.likesService.add(like)
      this.isLiked = like
      this.likes.push(like)
    }
  }

  private _filter(name: string): string[] {
    const filterValue = name.toLowerCase();

    return this.tagOptions.filter(tagOption => tagOption.toLowerCase().includes(filterValue));
  }
}