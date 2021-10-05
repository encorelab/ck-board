import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';

@Component({
  selector: 'app-post-modal',
  templateUrl: './post-modal.component.html',
  styleUrls: ['./post-modal.component.scss']
})
export class PostModalComponent {

  title: string
  desc: string
  isEditing: boolean = false
  canEditDelete: boolean

  titleControl = new FormControl('', [Validators.required, Validators.maxLength(50)]);
  descControl = new FormControl('', [Validators.maxLength(1000)]);
  matcher = new MyErrorStateMatcher();
  
  constructor(
    public dialogRef: MatDialogRef<PostModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
      this.title = data.post.title
      this.desc = data.post.desc
      this.canEditDelete = this.data.post.authorID == this.data.user.id || this.data.user.role == 'teacher'
  }

  
  onNoClick(): void {
    this.dialogRef.close();
  }

  toggleEdit() {
    this.isEditing = !this.isEditing
  }

  onUpdate() {
    this.data.updatePost(this.data.post.postID, this.title, this.desc)
    this.toggleEdit()
  }

  onDelete() {
    this.data.removePost(this.data.post.postID)
    this.dialogRef.close();
  }
}
