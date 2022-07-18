import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { UserService } from 'src/app/services/user.service';
import User from 'src/app/models/user';
import Group from 'src/app/models/group';
import { GroupMembers } from 'src/app/models/groupMembers';
import { ProjectService } from 'src/app/services/project.service';

@Component({
  selector: 'app-move-group-members',
  templateUrl: './move-group-members.component.html',
  styleUrls: ['./move-group-members.component.scss'],
})
export class MoveGroupMembersComponent implements OnInit {
  @Input() groups: Group[];
  @Input() projectID: string;
  @Output() updateGroups: EventEmitter<Group[]> = new EventEmitter<Group[]>();

  groupMembers: GroupMembers[] = [];
  projectMembers: string[] = [];
  unassigned: User[] = [];

  constructor(
    private userService: UserService,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.projectService.get(this.projectID).then((project) => {
      if (project) this.projectMembers = project.members;
      this.setUnassignedMembers(this.groups);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    this.groupMembers.length = 0;
    this.groups.forEach((group) => {
      this.userService.getMultipleByIds(group.members).then((users) => {
        if (users) {
          const groupMembers: GroupMembers = {
            groupID: group.groupID,
            groupName: group.name,
            members: users,
          };
          this.groupMembers.push(groupMembers);
        }
      });
    });
    if (!changes.groups.firstChange) this.setUnassignedMembers(this.groups);
  }

  setUnassignedMembers(groups: Group[]) {
    this.unassigned.length = 0;
    let memberIDs: string[] = [];
    this.projectMembers.forEach((member) => {
      if (!groups.some((group) => group.members.includes(member)))
        memberIDs.push(member);
    });
    this.userService.getMultipleByIds(memberIDs).then((users) => {
      if (users) this.unassigned.push(...users);
    });
  }

  getGroups(): Group[] {
    const groups: Group[] = [];
    this.groupMembers.forEach((gm) => {
      const updatedGroup: Group = {
        groupID: gm.groupID,
        projectID: this.projectID,
        name: gm.groupName,
        members: gm.members.map((member) => member.userID),
      };
      groups.push(updatedGroup);
    });
    return groups;
  }

  drop(event: CdkDragDrop<User[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      this.updateGroups.emit(this.getGroups());
    }
  }
}
