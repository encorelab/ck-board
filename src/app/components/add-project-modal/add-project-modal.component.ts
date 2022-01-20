import { Component, OnInit,Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA  } from '@angular/material/dialog';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';
import { AddPostComponent } from '../add-post-modal/add-post.component';
import { Utils } from 'src/app/utils/Utils';

@Component({
  selector: 'app-add-project-modal',
  templateUrl: './add-project-modal.component.html',
  styleUrls: ['./add-project-modal.component.scss']
})
export class AddProjectModalComponent implements OnInit {

  name:string = ''
  isPublic:boolean = false


  constructor(
    public dialogRef: MatDialogRef<AddProjectModalComponent>,
    public authService:AuthService,
    public userService:UserService,
    @Inject(MAT_DIALOG_DATA) public data: any){

     }

  ngOnInit(): void {
  }
  handleDialogSubmit() {
    const projectID = Date.now() + '-' + this.data.user.id
    this.data.createProject({
      projectID: projectID,
      teacherID: this.data.user.id,
      name: this.name,
      members: [this.authService.userData.id],
      boards:[],
      public:this.isPublic,
      joinCode: Utils.generateCode(5).toString()
    })
    this.dialogRef.close();
  }
  onNoClick(): void {
    this.dialogRef.close();
  }

}
