import { Component, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialogInterface } from 'src/app/interfaces/dialog.interface';
import { Board } from 'src/app/models/board';
import { Tag } from 'src/app/models/post';
import User from 'src/app/models/user';
import { POST_COLOR } from 'src/app/utils/constants';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';
import { FabricUtils } from 'src/app/utils/FabricUtils';
import { FabricPostComponent } from '../fabric-post/fabric-post.component';

@Component({
  selector: 'app-dialog',
  templateUrl: './add-post.component.html',
  styleUrls: ['./add-post.component.scss']
})
export class AddPostComponent {
  user: User
  board: Board

  title: string = ''
  message: string = ''

  tags: Tag[] = []
  tagOptions: Tag[] = []
  
  titleControl = new FormControl('', [Validators.required, Validators.maxLength(50)]);
  msgControl = new FormControl('', [Validators.maxLength(1000)]);
  matcher = new MyErrorStateMatcher();

  constructor(
    public fabricUtils: FabricUtils,
    public dialogRef: MatDialogRef<AddPostComponent>,
    @Inject(MAT_DIALOG_DATA) public data) {
      this.user = data.user
      this.board = data.board
      this.tagOptions = data.board.tags.filter(n => !this.tags.map(b => b.name).includes(n.name))
    }

  addTag(event, tagOption): void {
    event.stopPropagation()
    this.tags.push(tagOption);
    this.tagOptions = this.tagOptions.filter(tag => tag != tagOption)
  }

  removeTag(tag) {
    const index = this.tags.indexOf(tag);
    if (index >= 0) {
      this.tags.splice(index, 1);
    }

    this.tagOptions.push(tag);
  }

  addPost = () => {
    var fabricPost = new FabricPostComponent({
      title: this.title,
      author: this.user.username,
      authorID: this.user.id,
      desc: this.message,
      tags: this.tags,
      lock: !this.board.permissions.allowStudentMoveAny,
      left: this.data.left,
      top: this.data.top,
      color: POST_COLOR,
    });
    this.fabricUtils._canvas.add(fabricPost);
  }

  handleDialogSubmit() {
    this.addPost();
    this.dialogRef.close();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
