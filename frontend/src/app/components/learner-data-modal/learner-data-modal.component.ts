import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import LearnerModel, { DimensionValue } from 'src/app/models/learner';
import { AuthUser, Role } from 'src/app/models/user';
import { LearnerService } from 'src/app/services/learner.service';
import { ProjectService } from 'src/app/services/project.service';
import { UserService } from 'src/app/services/user.service';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';

export interface LearnerDataInput {
  model: LearnerModel;
  projectID: string;
  selectedStudentID: string;
  onUpdate: Function;
}

@Component({
  selector: 'app-learner-data-modal',
  templateUrl: './learner-data-modal.component.html',
  styleUrls: ['./learner-data-modal.component.scss'],
})
export class LearnerDataModalComponent implements OnInit {
  formArray: FormControl[] = [];
  matcher = new MyErrorStateMatcher();

  model: LearnerModel;
  students: AuthUser[];

  student: AuthUser | null;
  assessment: string | null;
  dimensionValues: DimensionValue[];

  constructor(
    public dialogRef: MatDialogRef<LearnerDataModalComponent>,
    public learnerService: LearnerService,
    public userService: UserService,
    public projectService: ProjectService,
    public fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: LearnerDataInput
  ) {}

  async ngOnInit(): Promise<void> {
    this.model = this.data.model;
    this.model.dimensions.map(() =>
      this.formArray.push(
        new FormControl('', [
          Validators.required,
          Validators.min(0),
          Validators.max(100),
        ])
      )
    );
    this.students = (
      await this.userService.getByProject(this.data.projectID)
    ).filter((u) => {
      if (u.userID === this.data.selectedStudentID) this.student = u;
      return u.role == Role.STUDENT;
    });
  }

  studentChange(): void {
    if (this.student && this.assessment) {
      this.dimensionValues = this.model.data.filter(
        (d) => d.student.userID === this.student?.userID
      );
    }
  }

  assessmentChange(): void {
    if (this.student != null && this.assessment) {
      this.dimensionValues = this.model.data.filter(
        (d) => d.student.userID === this.student?.userID
      );
    }
  }

  async updateDataSeries(): Promise<void> {
    if (!this.student || !this.assessment) return;

    this.model = await this.learnerService.updateData(
      this.model.modelID,
      this.student.userID,
      this.assessment,
      this.dimensionValues
    );
    this.data.onUpdate(this.model);
    this.onClose();
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
