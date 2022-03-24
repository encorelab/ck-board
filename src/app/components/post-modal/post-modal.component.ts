import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';
import Comment from 'src/app/models/comment';
import { CommentService } from 'src/app/services/comment.service';
import User from 'src/app/models/user';
import { LikesService } from 'src/app/services/likes.service';
import Like from 'src/app/models/like';
import { PostService } from 'src/app/services/post.service';
import { BucketService } from 'src/app/services/bucket.service';
import { FabricUtils } from 'src/app/utils/FabricUtils';
import Post, { Tag } from 'src/app/models/post';
import { DELETE } from '@angular/cdk/keycodes';
import { Role } from 'src/app/utils/constants';
import { POST_COLOR } from 'src/app/utils/constants';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';

const linkifyStr = require('linkifyjs/lib/linkify-string');

@Component({
  selector: 'app-post-modal',
  templateUrl: './post-modal.component.html',
  styleUrls: ['./post-modal.component.scss']
})
export class PostModalComponent {
  tags: Tag[] = []
  tagOptions: Tag[] = []

  user: User
  post: Post
  buckets: any[]

  title: string
  editingTitle: string
  desc: string
  editingDesc: string
  isEditing: boolean = false
  canEditDelete: boolean
  canStudentComment:boolean
  canStudentTag:boolean
  postColor: string;
  showComments: boolean = false
  showEditDelete: boolean = false
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
    public dialog: MatDialog,
    public commentService: CommentService, public likesService: LikesService,
    public postService: PostService, public bucketService: BucketService,
    public fabricUtils: FabricUtils,
    @Inject(MAT_DIALOG_DATA) public data: any) {
      dialogRef.backdropClick().subscribe(() => this.close())
      this.user = data.user
      this.postService.get(data.post.postID).then((item) => {
        item.forEach((post) => {
          var p = post.data()
          this.post = p
          this.title = p.title
          this.editingTitle = linkifyStr(p.title, { defaultProtocol: 'https', target: "_blank"})
          this.desc = p.desc
          this.editingDesc = linkifyStr(p.desc, { defaultProtocol: 'https', target: "_blank"})
          this.tags = p.tags
          this.tagOptions = data.board.tags.filter(n => !this.tags.map(b => b.name).includes(n.name))
          
          this.canEditDelete = this.data.post.authorID == this.user.id || this.user.role == Role.TEACHER
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
      this.bucketService.getAllByBoard(this.data.board.boardID).then(buckets => {
        this.buckets = []
        buckets.forEach(bucket => {
          bucket.includesPost = bucket.posts.some(post => post.postID == this.post.postID)
          this.buckets.push(bucket)
        })
      })
      
    let isStudent = this.user.role == Role.STUDENT
    let isTeacher = this.user.role == Role.TEACHER
    this.showEditDelete = (isStudent && data.board.permissions.allowStudentEditAddDeletePost) || isTeacher 
    this.canStudentComment = (isStudent && data.board.permissions.allowStudentCommenting) || isTeacher 
    this.canStudentTag = (isStudent && data.board.permissions.allowStudentTagging) || isTeacher 
    this.showAuthorName = (isStudent && data.board.permissions.showAuthorNameStudent) || (isTeacher && data.board.permissions.showAuthorNameTeacher)
    this.postColor = POST_COLOR;
  }
  
  close(): void {
    this.dialogRef.close(this.post);
  }
  
  updateBucket(event) {
    const bucketID = event.source.id
    const bucket: any = this.buckets.find(bucket => bucket.bucketID === bucketID)

    if (event.checked) {
      bucket.posts.push(this.post)
    } else {
      bucket.posts = bucket.posts.filter(post => post.postID !== this.post.postID)
    }

    let ids = bucket.posts.map(post => post.postID)
    this.bucketService.add(bucketID, ids)
  }

  toggleEdit() {
    this.isEditing = !this.isEditing
  }

  toggleComments() {
    this.showComments = !this.showComments
  }

  onUpdate() {
    this.editingTitle = this.title
    this.editingDesc = this.desc
    
    var obj: any = this.fabricUtils.getObjectFromId(this.post.postID);
    // check if post is on board
    if (obj){
      obj = this.fabricUtils.updatePostTitleDesc(obj, this.title, this.desc)
      obj.set({ title: this.title, desc: this.desc })
      this.fabricUtils._canvas.renderAll()

      obj = this.fabricUtils.toJSON(obj)
    }
    // bucket only so fabricObject is {}
    else{
      obj ="{}"
    }

    this.postService.update(this.post.postID, { fabricObject: obj, title: this.title, desc: this.desc })
      .then(() => this.toggleEdit())
  }

  onDelete() {
    this.dialog.open(ConfirmModalComponent, {
      width: '500px',
      data: {
        title: 'Confirmation',
        message: 'Are you sure you want to permanently delete this post?',
        handleConfirm: () => {
          this.postService.delete(this.post.postID).then(() => {
            var obj = this.fabricUtils.getObjectFromId(this.post.postID);
    
            if (obj && obj.type == 'group') {
              this.fabricUtils._canvas.remove(obj);
              this.fabricUtils._canvas.renderAll();
            }
            this.dialogRef.close(DELETE);
          })
        }
      }
    });
  }

  addTag(event, tagOption): void {
    event.stopPropagation()
    this.tags.push(tagOption);
    this.tagOptions = this.tagOptions.filter(tag => tag != tagOption)
    this.postService.update(this.post.postID, { tags: this.tags })
  }

  removeTag(tag) {
    if(!this.canStudentTag)
      return
    const index = this.tags.indexOf(tag);
    if (index >= 0) {
      this.tags.splice(index, 1);
    }

    this.tagOptions.push(tag);
    this.postService.update(this.post.postID, { tags: this.tags })
  }

  addComment() {
    const comment: Comment = {
      comment: this.newComment,
      commentID: Date.now() + '-' + this.data.user.id,
      userID: this.data.user.id,
      postID: this.post.postID,
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
    if(this.user.role == Role.STUDENT && !this.data.board.permissions.allowStudentLiking){
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
        postID: this.post.postID,
        boardID: this.data.board.boardID
      }
      this.likesService.add(like)
      this.isLiked = like
      this.likes.push(like)
    }
  }
}