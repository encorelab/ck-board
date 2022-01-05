import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';
import Comment from 'src/app/models/comment';
import { CommentService } from 'src/app/services/comment.service';
import User from 'src/app/models/user';
import { LikesService } from 'src/app/services/likes.service';
import Like from 'src/app/models/like';
import { PostService } from 'src/app/services/post.service';
const linkifyStr = require('linkifyjs/lib/linkify-string');

@Component({
  selector: 'app-post-modal',
  templateUrl: './post-modal.component.html',
  styleUrls: ['./post-modal.component.scss']
})
export class PostModalComponent {
  tags: string[] = []
  tagOptions: string[] = []

  user: User

  title: string
  editingTitle: string
  desc: string
  editingDesc: string
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
          this.editingTitle = linkifyStr(p.title, { defaultProtocol: 'https', target: "_blank"})
          this.desc = p.desc
          this.editingDesc = linkifyStr(p.desc, { defaultProtocol: 'https', target: "_blank"})
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

  addTag(event, tagOption): void {
    event.stopPropagation()
    this.tags.push(tagOption);
    this.tagOptions = this.tagOptions.filter(tag => tag != tagOption)
    this.postsService.update(this.data.post.postID, { tags: this.tags })
  }

  removeTag(tag) {
    const index = this.tags.indexOf(tag);
    if (index >= 0) {
      this.tags.splice(index, 1);
    }

    this.tagOptions.push(tag);
    this.postsService.update(this.data.post.postID, { tags: this.tags })
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
}