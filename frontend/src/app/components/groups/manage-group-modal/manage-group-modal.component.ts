import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import {
  MatLegacyDialog as MatDialog,
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
} from '@angular/material/legacy-dialog';
import { MatLegacySelect as MatSelect } from '@angular/material/legacy-select';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';
import { distribute, generateUniqueID } from 'src/app/utils/Utils';
import { ConfirmModalComponent } from '../../confirm-modal/confirm-modal.component';
import { MoveGroupMembersComponent } from '../move-group-members/move-group-members.component';
import { GroupService } from 'src/app/services/group.service';
import { Group } from 'src/app/models/group';
import { MatLegacyTabChangeEvent as MatTabChangeEvent } from '@angular/material/legacy-tabs';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { SocketEvent } from 'src/app/utils/constants';
import { SocketService } from 'src/app/services/socket.service';
import { EventBusService } from 'src/app/services/event-bus.service';

import { WorkflowService } from 'src/app/services/workflow.service';
import {
  ContainerType,
  GroupTask,
  GroupTaskStatus,
  TaskAction,
  TaskActionType,
  TaskWorkflowType,
} from 'src/app/models/workflow';
import { PostService } from 'src/app/services/post.service';
import { PostType } from 'src/app/models/post';
import { BucketService } from 'src/app/services/bucket.service';
import { GroupTaskService } from 'src/app/services/groupTask.service';
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
  showEdit = false;
  editGroup: Group;
  selectedTab: Number = 0;
  groupsHasChanged = false;

  groupNameControl = new UntypedFormControl('', [Validators.required]);
  editNameControl = new UntypedFormControl('', [Validators.required]);
  matcher = new MyErrorStateMatcher();

  constructor(
    private socketService: SocketService,
    private eventBus: EventBusService,
    private workflowService: WorkflowService,
    private groupService: GroupService,
    private postService: PostService,
    private bucketService: BucketService,
    private groupTaskService: GroupTaskService,
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<ManageGroupModalComponent>,
    private snackbarService: SnackbarService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.initializeGroups();
    this.dialogRef.disableClose = true;
    this.dialogRef.backdropClick().subscribe(() => {
      this.handleCloseConfirm();
    });
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

  groupsChanged(changed: boolean): void {
    this.groupsHasChanged = changed;
  }

  saveGroups(): void {
    const promises: Promise<Group>[] = [];
    this.updatedGroups.forEach((group) => {
      promises.push(this.groupService.update(group.groupID, group));
      this.socketService.emit(SocketEvent.GROUP_CHANGE, group.groupID);
      this.eventBus.emit('groupChange', group.groupID);
      if (this.editGroup && this.editGroup.groupID === group.groupID)
        this.editGroup = group;
      this.groups.forEach((elem, index) => {
        if (elem.groupID === group.groupID) this.groups[index] = group;
      });
    });
    Promise.all(promises)
      .then(() => {
        this.snackbarService.queueSnackbar('Successfully saved groups');
      })
      .catch((error) => {
        this.snackbarService.queueSnackbar(error.data.message);
      });
    this.groupsChanged(false);
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

  closeModal(): void {
    this.dialogRef.close();
  }

  handleCloseConfirm(): void {
    if (this.groupsHasChanged) {
      this.dialog.open(ConfirmModalComponent, {
        width: '500px',
        data: {
          title: 'Confirmation',
          message: 'You have unsaved changes',
          confirmLabel: 'Save groups',
          cancelLabel: 'Close without saving',
          handleConfirm: async () => {
            this.saveGroups();
          },
          handleCancel: async () => {
            this.closeModal();
          },
        },
      });
    } else {
      this.closeModal();
    }
  }

  tabChanged(tabChangeEvent: MatTabChangeEvent): void {
    this.selectedTab = tabChangeEvent.index;
  }

  /* --- CRUD operations --- */

  async updateGroup(group: Group) {
    const originalGroup = await this.groupService.getById(group.groupID);

    if (!originalGroup) return;

    const removedMembers = originalGroup.members.filter(
      (member) => !group.members.includes(member)
    );
    const addedMembers = group.members.filter(
      (member) => !originalGroup.members.includes(member)
    );

    const workflows = await this.workflowService.getWorkflowsByGroup(
      group.groupID
    );
    for (const member of addedMembers) {
      for (const workflow of workflows) {
        if (!workflow.active) continue;
        let taskExists = true;
        try {
          const groupTask =
            await this.workflowService.getGroupTaskByWorkflowGroup(
              group.groupID,
              workflow.workflowID,
              member,
              'default'
            );
        } catch {
          taskExists = false;
        }
        if (!taskExists) {
          const source = workflow.source;
          const assignedIndividual = workflow.assignedIndividual;
          let posts: string[] = [];
          const progress: Map<string, TaskAction[]> = new Map<
            string,
            TaskAction[]
          >();
          if (workflow.type != TaskWorkflowType.GENERATION) {
            let sourcePosts;
            if (source.type == ContainerType.BOARD) {
              sourcePosts = await this.postService.getAllByBoardNO(
                source.id,
                PostType.BOARD
              );
              sourcePosts = sourcePosts.map((p) => p.postID);
            } else {
              const bucket = await this.bucketService.get(source.id);
              sourcePosts = bucket ? bucket.posts : [];
            }

            // if (taskWorkflow?.type === TaskWorkflowType.GENERATION) sourcePosts = [];
            const commentAction = workflow.requiredActions.find(
              (a) => a.type == TaskActionType.COMMENT
            );
            const tagAction = workflow.requiredActions.find(
              (a) => a.type == TaskActionType.TAG
            );
            const createPostAction = workflow.requiredActions.find(
              (a) => a.type == TaskActionType.CREATE_POST
            );

            const actions: TaskAction[] = [];
            if (commentAction)
              actions.push({
                type: TaskActionType.COMMENT,
                amountRequired: commentAction.amountRequired,
              });
            if (tagAction)
              actions.push({
                type: TaskActionType.TAG,
                amountRequired: tagAction.amountRequired,
              });
            if (!assignedIndividual) return;
            const split: string[][] = distribute(
              this.shufflePosts(sourcePosts),
              sourcePosts.length / assignedIndividual.members.length
            );
            posts = split[0];
            posts.forEach((post) => {
              progress.set(post, actions);
            });
          }
          const newGroupTask: GroupTask = {
            groupTaskID: generateUniqueID(),
            groupID: group.groupID,
            workflowID: workflow.workflowID,
            posts: posts,
            progress: Array.from(progress.entries()).reduce(
              (obj, [key, value]) => {
                obj[key] = value;
                return obj;
              },
              {} as Record<string, TaskAction[]>
            ),
            userID: member,
            status: GroupTaskStatus.INACTIVE,
          };
          await this.groupTaskService.createGroupTask(newGroupTask);
        }
      }
    }
    await this.groupService.update(group.groupID, group);
    this.socketService.emit(SocketEvent.GROUP_CHANGE, group.groupID);
    this.eventBus.emit('groupChange', group.groupID);
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
          this.socketService.emit(SocketEvent.GROUP_DELETE, group);
          this.eventBus.emit('deleteWorkflowTask', group);
          this.groups.forEach((obj, index) => {
            if (obj.groupID == group.groupID) this.groups.splice(index, 1);
          });
        },
      },
    });
  }
  shufflePosts = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  };
}
