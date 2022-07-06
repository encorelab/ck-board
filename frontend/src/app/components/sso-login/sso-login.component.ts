import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-sso-login',
  templateUrl: './sso-login.component.html',
  styleUrls: ['./sso-login.component.scss'],
})
export class SsoLoginComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    const sso = this.route.snapshot.paramMap.get('sso');
    const sig = this.route.snapshot.paramMap.get('sig');
    this.userService.ssoLogin(sso, sig);
  }
}
