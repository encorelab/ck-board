import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthUser } from 'src/app/models/user';
import { UserService } from 'src/app/services/user.service';
import { Board, BoardScope } from 'src/app/models/board'; // Import Board and BoardScope
import { Project } from 'src/app/models/project';       // Import Project


@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent implements OnInit {
  @Input()
  user: AuthUser;

  @Input()
  embedded = false;

  @Input()
  showSignOut = false;

  @Input() board?: Board; // Make board optional
  @Input() project?: Project; // Make project optional
  BoardScope: typeof BoardScope = BoardScope; //for comparing enum in the template


  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {}

  signOut(): void {
    this.userService.logout();
    this.router.navigate(['login']);
  }
}