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

  constructor(
    public dialogRef: MatDialogRef<LearnerConfigurationModalComponent>,
    public learnerService: LearnerService,
    @Inject(MAT_DIALOG_DATA) public model: LearnerModel
  ) {}

  ngOnInit(): void {}

  async addDimension(): Promise<void> {
    if (this.newDimensionText.length > 0) {
      this.model = await this.learnerService.addDimension(
        this.model.modelID,
        this.newDimensionText
      );
      this.newDimensionText = '';
    }
  }

  async removeDimension(dimension: string): Promise<void> {
    if (this.newDimensionText.length > 0) {
      this.model = await this.learnerService.removeDimension(
        this.model.modelID,
        dimension
      );
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
