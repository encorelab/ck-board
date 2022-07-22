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
  @Input() headerText: string;
  @Output() updateGroups: EventEmitter<Group[]> = new EventEmitter<Group[]>();

  groupMembers: GroupMembers[] = [];
  projectMembers: string[] = [];
  unassigned: User[] = [];

  constructor(
    private userService: UserService,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    let promises: Promise<any>[] = [];
    if (changes.groups.firstChange) promises.push(this.updateProjectMembers());

    promises.push(...this.updateGroupMembers());

    Promise.all(promises).then(() => {
      this.updateGroups.emit(this.getGroups());
      this.updateUnassignedMembers();
    });
  }

  private updateGroupMembers(): Promise<any>[] {
    this.groupMembers.length = 0;
    let promises: Promise<any>[] = [];
    this.groups.forEach((group) => {
      promises.push(
        this.userService.getMultipleByIds(group.members).then((users) => {
          if (users) {
            const groupMembers: GroupMembers = {
              groupID: group.groupID,
              groupName: group.name,
              members: users,
            };
            this.groupMembers.push(groupMembers);
          }
        })
      );
    });
    return promises;
  }

  private updateProjectMembers(): Promise<any> {
    return this.projectService.get(this.projectID).then((project) => {
      if (project) this.projectMembers = project.members;
    });
  }

  private updateUnassignedMembers(): void {
    this.unassigned.length = 0;
    let memberIDs: string[] = [];
    this.projectMembers.forEach((member) => {
      const isUnassigned = !this.groupMembers.some((group) => {
        return group.members.map((gm) => gm.userID).includes(member);
      });
      if (isUnassigned) memberIDs.push(member);
    });
    this.userService.getMultipleByIds(memberIDs).then((users) => {
      if (users) this.unassigned.push(...users);
      this.updateGroups.emit(this.getGroups());
    });
  }

  private getGroups(): Group[] {
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

  unassignAllMembers() {
    this.clearAllGroupMembers();
    this.updateUnassignedMembers();
  }

  removeMember(groupIndex: number, memberIndex: number): void {
    this.groupMembers[groupIndex].members.splice(memberIndex, 1);
    this.updateUnassignedMembers();
  }

  removeAllMembers(groupIndex: number): void {
    this.groupMembers[groupIndex].members.length = 0;
    this.updateUnassignedMembers();
  }

  shuffleBetweenGroups(): void {
    if (this.groupMembers.length == 0) return;

    const members = this.removeDuplicateUsers(
      this.getAllMembersInSelectedGroups()
    );
    const shuffledMembers = this.shuffleArray(members);

    this.clearUnassignedMembers();
    this.clearAllGroupMembers();

    shuffledMembers.forEach((member, index) => {
      this.groupMembers[index % this.groupMembers.length].members.push(member);
    });
    this.updateGroups.emit(this.getGroups());
  }

  private clearUnassignedMembers(): void {
    this.unassigned = [];
  }

  private clearAllGroupMembers(): void {
    this.groupMembers.forEach((group) => (group.members = []));
  }

  private getAllMembersInSelectedGroups(): User[] {
    const members: User[] = [];
    this.groupMembers.forEach((group) => {
      members.push(...group.members);
    });
    members.push(...this.unassigned);
    return members;
  }

  private removeDuplicateUsers(users: User[]): User[] {
    const ids = users.map((user) => user.userID);
    return users.filter(
      ({ userID }, index) => !ids.includes(userID, index + 1)
    );
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

  // https://stackoverflow.com/a/2450976/4970939
  // Uses Fisher-Yates shuffle https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
  private shuffleArray(array: any[]): any[] {
    let currentIndex = array.length,
      randomIndex;
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }
    return array;
  }
}
