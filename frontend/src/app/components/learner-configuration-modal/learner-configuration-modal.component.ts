import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import LearnerModel from 'src/app/models/learner';
import { LearnerService } from 'src/app/services/learner.service';

@Component({
  selector: 'app-learner-configuration-modal',
  templateUrl: './learner-configuration-modal.component.html',
  styleUrls: ['./learner-configuration-modal.component.scss'],
})
export class LearnerConfigurationModalComponent implements OnInit {
  newDimensionText: string = '';

  model: LearnerModel;

  constructor(
    public dialogRef: MatDialogRef<LearnerConfigurationModalComponent>,
    public learnerService: LearnerService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.model = data.model;
  }

  ngOnInit(): void {}

  async addDimension(): Promise<void> {
    if (this.newDimensionText.length > 0) {
      this.model = await this.learnerService.addDimension(
        this.model.modelID,
        this.newDimensionText
      );
      this.newDimensionText = '';
      this.data.onUpdate(this.model);
    }
  }

  async removeDimension(dimension: string): Promise<void> {
    this.model = await this.learnerService.removeDimension(
      this.model.modelID,
      dimension
    );
    this.data.onUpdate(this.model);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
