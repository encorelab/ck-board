import { Component, Inject, OnInit } from '@angular/core';
import { MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { Action } from 'src/app/services/snackbar.service';

const linkifyStr = require('linkifyjs/lib/linkify-string');

@Component({
  selector: 'app-snackbar-component',
  templateUrl: './snackbar.component.html',
  styleUrls: ['./snackbar.component.scss'],
})
export class SnackBarComponent implements OnInit {
  title: string;
  description: string;

  action: Action;

  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any) {}

  ngOnInit(): void {
    this.title = linkifyStr(this.data.title, {
      defaultProtocol: 'https',
      target: '_blank',
    });
    this.description = linkifyStr(this.data.description, {
      defaultProtocol: 'https',
      target: '_blank',
    });
    this.action = this.data.action;
  }

  doAction() {
    this.action.run();
  }

  close() {
    this.data.close();
  }
}
