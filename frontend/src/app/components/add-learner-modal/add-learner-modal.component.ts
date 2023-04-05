import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Board } from 'src/app/models/board';
import { AuthUser, Role } from 'src/app/models/user';
import { LearnerService } from 'src/app/services/learner.service';
import { UserService } from 'src/app/services/user.service';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';

export interface AddLearnerInput {
  board: Board;
  onCreate: Function;
}

@Component({
  selector: 'app-add-learner-modal',
  templateUrl: './add-learner-modal.component.html',
  styleUrls: ['./add-learner-modal.component.scss'],
})
export class AddLearnerModalComponent implements OnInit {
  name: string = '';

  newDimensionText: string = '';
  dimensions: string[] = [];

  nameControl = new FormControl('', [
    Validators.required,
    Validators.maxLength(50),
  ]);
  matcher = new MyErrorStateMatcher();

  constructor(
    public dialogRef: MatDialogRef<AddLearnerModalComponent>,
    private learnerService: LearnerService,
    @Inject(MAT_DIALOG_DATA) public data: AddLearnerInput
  ) {}

  ngOnInit(): void {}

  addDimension(): void {
    this.dimensions.push(this.newDimensionText);
    this.newDimensionText = '';
  }

  removeDimension(dimension: string): void {
    const index = this.dimensions.indexOf(dimension);
    if (index != -1) this.dimensions.splice(index);
  }

  onClose(): void {
    this.dialogRef.close();
  }

  async createModel(): Promise<void> {
    const model = await this.learnerService.createModel(
      this.data.board.projectID,
      this.data.board.boardID,
      this.name,
      this.dimensions
    );
    this.data.onCreate(model);
    this.dialogRef.close();
  }
}
