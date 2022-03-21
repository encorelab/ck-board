import { Component, Inject, OnInit } from "@angular/core";
import { MAT_SNACK_BAR_DATA } from "@angular/material/snack-bar";
import { Action } from "src/app/services/snackbar.service";

@Component({
  selector: 'snackbar-component',
  templateUrl: './snackbar.component.html',
  styleUrls: ['./snackbar.component.scss'],
})
export class SnackBarComponent implements OnInit {

  action: Action;

  constructor(@Inject(MAT_SNACK_BAR_DATA) public data: any) { }
  ngOnInit(): void {
    this.action = this.data.action;
  }

  doAction() {
    this.action.run();
  }

  close() {
    this.data.close();
  }

}