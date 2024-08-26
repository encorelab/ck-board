import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ViewType } from 'src/app/models/board';
import { AuthUser } from 'src/app/models/user';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent implements OnInit {
  mobile: boolean = false;

  @Input()
  user: AuthUser;

  @Input()
  embedded = false;

  @Input()
  showSignOut = false;

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {
    if (window.screen.width < 700) { // 768px portrait
    this.mobile = true;
    }
  }

  signOut(): void {
    this.userService.logout();
    this.router.navigate(['login']);
  }
}
