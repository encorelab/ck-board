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
  desc: string
  isEditing: boolean = false
  showEditDelete: boolean = false
  canEditDelete: boolean
  canStudentComment:boolean
  canStudentTag:boolean
  showComments: boolean = false
  showAuthorName:boolean

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
          this.desc = p.desc
          this.tags = p.tags
          this.tagOptions = data.board.tags.filter(n => !this.tags.includes(n))
          this.canEditDelete = this.data.post.authorID == this.user.id || this.user.role == 'teacher'
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
     this.showEditDelete = (this.user.role =="student" && data.board.permissions.allowStudentEditAddDeletePost) || this.user.role =="teacher"
     this.canStudentComment = (this.user.role =="student" && data.board.permissions.allowStudentCommenting) || this.user.role =="teacher"
     this.canStudentTag = (this.user.role =="student" && data.board.permissions.allowStudentTagging) || this.user.role =="teacher"
     this.showAuthorName = (this.user.role =="student" && data.board.permissions.showAuthorNameStudent) || (this.user.role =="teacher"&& data.board.permissions.showAuthorNameTeacher)
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
    if(!this.canStudentTag)
      return
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
    // if liking is locked just return (do nothing)
    if(this.user.role =="student" && !this.data.board.permissions.allowStudentLiking){
      return;
    }
      
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