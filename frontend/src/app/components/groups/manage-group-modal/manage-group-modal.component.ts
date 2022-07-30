import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';
import { generateUniqueID } from 'src/app/utils/Utils';
import { ConfirmModalComponent } from '../../confirm-modal/confirm-modal.component';
import { MoveGroupMembersComponent } from '../move-group-members/move-group-members.component';
import { GroupService } from 'src/app/services/group.service';
import { Group } from 'src/app/models/group';

@Component({
  selector: 'app-manage-group-modal',
  templateUrl: './manage-group-modal.component.html',
  styleUrls: ['./manage-group-modal.component.scss'],
})
export class ManageGroupModalComponent implements OnInit {
  @ViewChild('selectGroups') select: MatSelect;
  @ViewChild(MoveGroupMembersComponent) child: MoveGroupMembersComponent;

  groups: Group[] = [];
  selectedGroups: Group[] = [];
  updatedGroups: Group[];
  showEdit: boolean = false;
  editGroup: Group;

  groupNameControl = new FormControl('', [Validators.required]);
  editNameControl = new FormControl('', [Validators.required]);
  matcher = new MyErrorStateMatcher();

  constructor(
    private groupService: GroupService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.initializeGroups();
  }

  private initializeGroups(): void {
    this.groups = [];
    this.groupService
      .getByProjectId(this.data.project.projectID)
      .then((groups) => {
        if (groups) this.groups.push(...groups);
      });
  }

  updateGroups(groups: Group[]): void {
    this.updatedGroups = [];
    this.updatedGroups.push(...groups);
  }

  saveGroups(): void {
    this.updatedGroups.forEach((group) => {
      this.groupService.update(group.groupID, group);
      if (this.editGroup && this.editGroup.groupID === group.groupID)
        this.editGroup = group;
      this.groups.forEach((elem, index) => {
        if (elem.groupID === group.groupID) this.groups[index] = group;
      });
    });
    this.select.options.forEach((item: MatOption) => item.deselect());
  }

  updateEditGroupMembers(group: Group): void {
    this.editGroup.members = group.members;
  }

  openEdit(group: Group): void {
    this.showEdit = true;
    this.editGroup = group;
  }

  closeEdit(): void {
    this.showEdit = false;
  }

  /* --- CRUD operations --- */

  async updateGroup(group: Group) {
    await this.groupService.update(group.groupID, group);
    this.closeEdit();
    this.groups.forEach((elem, index) => {
      if (elem.groupID === group.groupID) this.groups[index] = group;
    });
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
    this.groups.push(group);
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
        },
      },
    });
  }
}
