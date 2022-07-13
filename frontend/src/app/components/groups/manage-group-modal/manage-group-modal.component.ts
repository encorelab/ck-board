import { Component, OnInit, Inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ConfirmModalComponent } from '../../confirm-modal/confirm-modal.component';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';
import Group from 'src/app/models/group';
import { GroupService } from 'src/app/services/group.service';
import { UserService } from 'src/app/services/user.service';
import { generateUniqueID } from 'src/app/utils/Utils';
import User from 'src/app/models/user';
import { MatCheckboxChange } from '@angular/material/checkbox';

@Component({
  selector: 'app-manage-group-modal',
  templateUrl: './manage-group-modal.component.html',
  styleUrls: ['./manage-group-modal.component.scss'],
})
export class ManageGroupModalComponent implements OnInit {
  groups: Group[] = [];
  members: User[] = [];
  assigned: string[] = [];
  unassigned: Group;
  showEdit: boolean = false;
  editGroup: Group;
  groupNameControl = new FormControl('', [Validators.required]);
  editNameControl = new FormControl('', [Validators.required]);
  matcher = new MyErrorStateMatcher();

  constructor(
    public groupService: GroupService,
    public userService: UserService,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.unassigned = {
      groupID: '0',
      members: [],
      name: 'unassigned',
      projectID: this.data.project.projectID,
    };
    this.groups.length = 0;
    this.assigned.length = 0;

    this.groupService
      .getByProjectId(this.data.project.projectID)
      .then((groups) => {
        if (groups) this.groups.push(...groups);
      });
  }

  updateGroupMembers(members: string[]) {
    this.editGroup.members = members;
  }

  openEdit(group: Group) {
    this.showEdit = true;
    this.editGroup = group;
    this.data.project.members.forEach((member) => {
      if (!group.members.includes(member)) {
        this.unassigned.members.push(member);
      }
    });
  }

  closeEdit() {
    this.showEdit = false;
  }

  async updateGroup() {
    await this.groupService.update(this.editGroup.groupID, this.editGroup);
    this.closeEdit();
    this.ngOnInit();
  }

  async createGroup() {
    const group: Group = {
      groupID: generateUniqueID(),
      projectID: this.data.project.projectID,
      name: this.groupNameControl.value,
      members: this.assigned,
    };
    await this.groupService.create(group);
    this.groupNameControl.reset();
    this.ngOnInit();
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
            if (obj.groupID == group.groupID) this.groups.splice(index, 1);
          });
          this.ngOnInit();
        },
      },
    });
  }
}
