import { Component, Input, OnInit } from '@angular/core';
import User from 'src/app/models/user';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
})
export class ToolbarComponent implements OnInit {
  @Input()
  user: User;
  
  constructor(private authService: AuthService) {}

  ngOnInit(): void {}

  signOut(): void {
    this.authService.signOut();
  }
}
