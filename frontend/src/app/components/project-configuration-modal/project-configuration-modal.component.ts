import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl, Validators } from '@angular/forms';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';
import Group from 'src/app/models/group';
import { BoardService } from 'src/app/services/board.service';
import { GroupService } from 'src/app/services/group.service';
import { UserService } from 'src/app/services/user.service';
import { generateUniqueID } from 'src/app/utils/Utils';

@Component({
  selector: 'app-project-configuration-modal',
  templateUrl: './project-configuration-modal.component.html',
  styleUrls: ['./project-configuration-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ProjectConfigurationModalComponent implements OnInit {
  projectName: string;
  members: string[] = [];
  groups: Group[] = [];
  groupNameControl = new FormControl('', [Validators.required]);
  matcher = new MyErrorStateMatcher();

  createExpansion = false;

  constructor(
    public dialogRef: MatDialogRef<ProjectConfigurationModalComponent>,
    public boardService: BoardService,
    public groupService: GroupService,
    public userService: UserService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.projectName = data.project.name;
    data.project.members.map((id) => {
      userService.getOneById(id).then((user) => {
        if (user) {
          this.members.push(user.username);
        }
      });
    });
    groupService.getByProjectId(data.project.projectID).then((groups) => {
      if (groups) this.groups.push(...groups);
    })
  }
  handleDialogSubmit() {
    this.data.updateProjectName(this.projectName);
    this.dialogRef.close();
  }
  onNoClick(): void {
    this.dialogRef.close();
  }

  async createGroup() {
    const group: Group = {
      groupID: generateUniqueID(),
      projectID: this.data.project.projectID,
      name: this.groupNameControl.value,
      members: []
    }
    console.log(group);
    return await this.groupService.create(group);
  }

  async handleCreateGroup() {
    let group = await this.createGroup();
    this.groups.push(group);
    this.createExpansion = false;
    this.groupNameControl.reset();
  }

  ngOnInit(): void {}
}
