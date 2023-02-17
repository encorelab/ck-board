import { Component, Inject, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import LearnerModel from 'src/app/models/learner';
import { AuthUser, Role } from 'src/app/models/user';
import { LearnerService } from 'src/app/services/learner.service';
import { ProjectService } from 'src/app/services/project.service';
import { UserService } from 'src/app/services/user.service';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';

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
  series: number[];

  constructor(
    public dialogRef: MatDialogRef<LearnerDataModalComponent>,
    public learnerService: LearnerService,
    public userService: UserService,
    public projectService: ProjectService,
    public fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any
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
    ).filter((u) => u.role == Role.STUDENT);
  }

  studentChange(): void {
    if (this.student && this.assessment) {
      const userData = this.model.data.get(this.student.userID);
      if (userData && this.assessment === 'Diagnostic') {
        this.series = userData.map((v) => v.diagnostic);
      } else if (userData && this.assessment === 'Re-assessment') {
        this.series = userData.map((v) => v.reassessment);
      }
    }
  }

  assessmentChange(): void {
    if (this.student && this.assessment) {
      const userData = this.model.data[this.student.userID];
      if (userData && this.assessment === 'Diagnostic') {
        this.series = userData.map((v) => v.diagnostic);
      } else if (userData && this.assessment === 'Re-assessment') {
        this.series = userData.map((v) => v.reassessment);
      } else {
        this.series = this.model.dimensions.map(() => 0);
      }
    }
  }

  async updateDataSeries(): Promise<void> {
    if (!this.student || !this.assessment) return;

    this.model = await this.learnerService.updateData(
      this.model.modelID,
      this.student.userID,
      this.assessment,
      this.series
    );
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
