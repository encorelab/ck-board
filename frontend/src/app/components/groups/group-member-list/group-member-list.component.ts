import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import { UserService } from 'src/app/services/user.service';
import User from 'src/app/models/user';

@Component({
  selector: 'app-group-member-list',
  templateUrl: './group-member-list.component.html',
  styleUrls: ['./group-member-list.component.scss']
})
export class GroupMemberListComponent implements OnInit {
  @Input() firstMembers: string[];
  @Input() secondMembers: string[];
  @Input() fstGroupName: string;
  @Input() sndGroupName: string;
  @Output() updateFirstGroup: EventEmitter<string[]> = new EventEmitter<string[]>();
  @Output() updateSecondGroup: EventEmitter<string[]> = new EventEmitter<string[]>();


  firstGroup: User[] = [];
  secondGroup: User[] = [];
  
  constructor(
    public userService: UserService,
    ) {}

  ngOnInit(): void {
    this.userService.getOneById(this.firstMembers[0]).then((user) => {
    })

    this.userService.getMultipleByIds(this.firstMembers).then((users) => {
      if (users) this.firstGroup.push(...users);
    });

    this.userService.getMultipleByIds(this.secondMembers).then((users) => {
      if (users) this.secondGroup.push(...users);
    });
  }

  drop(event: CdkDragDrop<User[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      console.log(this.firstGroup);
      console.log(this.secondGroup);
      this.updateFirstGroup.emit(this.firstGroup.map(user => user.userID));
      this.updateSecondGroup.emit(this.secondGroup.map(user => user.userID));
    }
  }
}
