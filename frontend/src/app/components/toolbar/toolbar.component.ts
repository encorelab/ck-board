import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthUser } from 'src/app/models/user';
import { UserService } from 'src/app/services/user.service';

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

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit(): void {}

  signOut(): void {
    this.userService.logout();
    this.router.navigate(['login']);
  }
}
