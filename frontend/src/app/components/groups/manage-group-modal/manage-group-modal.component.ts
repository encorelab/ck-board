import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ConfirmModalComponent } from '../../confirm-modal/confirm-modal.component';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';
import Group from 'src/app/models/group';
import { GroupService } from 'src/app/services/group.service';
import { UserService } from 'src/app/services/user.service';
import { generateUniqueID } from 'src/app/utils/Utils';
import User from 'src/app/models/user';

@Component({
  selector: 'app-manage-group-modal',
  templateUrl: './manage-group-modal.component.html',
  styleUrls: ['./manage-group-modal.component.scss'],
})
export class ManageGroupModalComponent implements OnInit {
  @ViewChild('selectGroups') select: MatSelect;

  groups: Group[] = [];
  selectedGroups: Group[] = [];
  updatedGroups: Group[] = [];
  members: User[] = [];
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
    this.groups.length = 0;
    this.groupService
      .getByProjectId(this.data.project.projectID)
      .then((groups) => {
        if (groups) this.groups.push(...groups);
      });
  }

  async updateGroup(group: Group) {
    await this.groupService.update(group.groupID, group);
    this.closeEdit();
    this.ngOnInit();
  }

  updateEditGroupMembers(group: Group) {
    this.editGroup.members = group.members;
  }

  async updateGroups(groups: Group[]) {
    this.updatedGroups.length = 0;
    this.updatedGroups.push(...groups);
  }

  saveGroups() {
    this.updatedGroups.forEach((group) => {
      this.groupService.update(group.groupID, group);
      if (this.editGroup && this.editGroup.groupID === group.groupID)
        this.editGroup = group;
    });
    this.select.options.forEach((item: MatOption) => item.deselect());
    this.ngOnInit();
  }

  async createGroup() {
    const group: Group = {
      groupID: generateUniqueID(),
      projectID: this.data.project.projectID,
      name: this.groupNameControl.value,
      members: [],
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

  openEdit(group: Group) {
    this.showEdit = true;
    this.editGroup = group;
  }

  closeEdit() {
    this.showEdit = false;
  }
}
