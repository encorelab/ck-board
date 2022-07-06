import { Component, OnInit, Inject } from "@angular/core";
import { FormControl, Validators } from '@angular/forms';
import { ConfirmModalComponent } from '../../confirm-modal/confirm-modal.component';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';
import Group from "src/app/models/group";
import { GroupService } from "src/app/services/group.service";
import { UserService } from "src/app/services/user.service";
import { generateUniqueID } from 'src/app/utils/Utils';
import User from "src/app/models/user";
import { MatCheckboxChange } from "@angular/material/checkbox";

@Component({
    selector: 'app-manage-group-modal',
    templateUrl: './manage-group-modal.component.html',
    styleUrls: ['./manage-group-modal.component.scss'],
})
export class ManageGroupModalComponent implements OnInit {
  groups: Group[] = [];
  members: User[] = [];
  assigned: string[] = [];
  unassigned: User[] = [];
  groupNameControl = new FormControl('', [Validators.required]);
  matcher = new MyErrorStateMatcher();
  
  constructor(
      public groupService: GroupService,
      public userService: UserService,
      public dialog: MatDialog,
      @Inject(MAT_DIALOG_DATA) public data: any
    ) {

      data.project.members.map((id) => {
        userService.getOneById(id).then((user) => {
          if (user) {
            this.members.push(user);
          }
          return user;
        }).then((user) => {
          groupService.getByUserId(user.userID).then((groups) => {
            if (groups.every((group) => group.projectID != data.project.projectID))
              this.unassigned.push(user);
          });
        });
      });

      groupService.getByProjectId(data.project.projectID).then((groups) => {
        if (groups) this.groups.push(...groups);
      })
    }

  ngOnInit(): void {}

  changeAssignment(event: MatCheckboxChange, user: string) {
    if (event.checked) this.assigned.push(user);
    else {
      this.assigned.forEach((id, index) => {
        if(id == user) this.assigned.splice(index, 1);
      });
    }
  }

  async createGroup() {
    const group: Group = {
      groupID: generateUniqueID(),
      projectID: this.data.project.projectID,
      name: this.groupNameControl.value,
      members: this.assigned
    }
    await this.groupService.create(group);
    this.groups.push(group);
    this.groupNameControl.reset();
    this.assigned.length = 0;
  }

  async deleteGroup(group: Group) {
    this.dialog.open(ConfirmModalComponent, {
      width: '500px',
      data: {
        title: 'Confirmation',
        message: 'Are you sure you want to permanently delete this group?',
        handleConfirm: async () => {
          await this.groupService.delete(group.groupID);
          this.groups.forEach((obj, index) => {
            if(obj.groupID == group.groupID) this.groups.splice(index, 1);
          });
        },
      },
    });
  }


}