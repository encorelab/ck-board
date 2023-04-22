import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Board } from 'src/app/models/board';
import { DimensionValue } from 'src/app/models/learner';
import { AuthUser, Role } from 'src/app/models/user';
import { LearnerService } from 'src/app/services/learner.service';
import { UserService } from 'src/app/services/user.service';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';

export interface AddLearnerInput {
  title?: string;
  board: Board;
  onCreate: Function;
}

export enum DataInputMethod {
  CSV = 'CSV',
  MANUAL_ENTRY = 'MANUAL_ENTRY',
}

@Component({
  selector: 'app-add-learner-modal',
  templateUrl: './add-learner-modal.component.html',
  styleUrls: ['./add-learner-modal.component.scss'],
})
export class AddLearnerModalComponent implements OnInit {
  name: string = '';

  newDimensionText: string = '';
  dimensions: Set<string> = new Set<string>();

  modelData: DimensionValue[] = [];
  stuDimToVals: Map<string, DimensionValue> = new Map<string, DimensionValue>();
  DELIMITER = ',,,';

  modelDataInputType: DataInputMethod = DataInputMethod.CSV;
  importCSV: any = null;
  filteredDimensions: DimensionValue[] = [];
  selectedStudent: AuthUser | null;
  selectedAssessment: string | null;

  idToStudent: Map<string, AuthUser> = new Map<string, AuthUser>();
  nameControl = new FormControl('', [
    Validators.required,
    Validators.maxLength(50),
  ]);
  matcher = new MyErrorStateMatcher();

  constructor(
    public dialogRef: MatDialogRef<AddLearnerModalComponent>,
    private userService: UserService,
    private learnerService: LearnerService,
    @Inject(MAT_DIALOG_DATA) public data: AddLearnerInput
  ) {}

  async ngOnInit(): Promise<void> {
    (await this.userService.getByProject(this.data.board.projectID)).map(
      (u) => {
        if (u.role == Role.STUDENT) {
          this.idToStudent.set(u.userID, u);
        }
      }
    );
  }

  addDimension(): void {
    this.dimensions.add(this.newDimensionText);
    if (this.modelDataInputType === 'MANUAL_ENTRY') {
      this.createValuesPerDimension(this.newDimensionText);
      this.filteredDimensions.push();
    }
    this.newDimensionText = '';
  }

  removeDimension(dimension: string): void {
    this.dimensions.delete(dimension);
    this.removeValuesPerDimension(dimension);
  }

  onFileSelected(event: any): void {
    this.importCSV = event.target.files[0] ?? null;
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      const result = fileReader.result;
      if (typeof result !== 'string') {
        throw new Error('ss');
      }
      for (const row of result.split('\n')) {
        const values = row.split(',');
        const student = this.idToStudent.get(values[0]);
        if (!student) throw new Error('Student does not exist');

        this.dimensions.add(values[1]);
        const dimValue = {
          student: student,
          dimension: values[1],
          diagnostic: Number(values[2]),
          reassessment: Number(values[3]),
        };
        this.stuDimToVals.set(this.buildKey(values[0], values[1]), dimValue);
        this.modelData.push(dimValue);
      }
      for (const dim of this.dimensions) {
        this.createValuesPerDimension(dim);
      }
    };
    fileReader.readAsText(this.importCSV);
  }

  studentChange(): void {
    if (this.selectedStudent && this.selectedAssessment) {
      this.filteredDimensions = [];
      this.stuDimToVals.forEach((dimValue, stuDim) => {
        if (stuDim.split(this.DELIMITER)[0] === this.selectedStudent?.userID) {
          this.filteredDimensions.push(dimValue);
        }
      });
    }
  }

  assessmentChange(): void {
    if (this.selectedStudent != null && this.selectedAssessment) {
      this.filteredDimensions = [];
      this.stuDimToVals.forEach((dimValue, stuDim) => {
        if (stuDim.split(this.DELIMITER)[0] === this.selectedStudent?.userID) {
          this.filteredDimensions.push(dimValue);
        }
      });
    }
  }

  createValuesPerDimension(dim: string): void {
    for (const [id, stu] of this.idToStudent) {
      if (this.stuDimToVals.has(this.buildKey(id, dim))) continue;
      const dimValue = {
        student: stu,
        dimension: dim,
        diagnostic: 0,
        reassessment: 0,
      };
      if (this.selectedStudent?.userID === id) {
        this.filteredDimensions.push(dimValue);
      }
      this.stuDimToVals.set(this.buildKey(id, dim), dimValue);
      this.modelData.push(dimValue);
    }
  }

  removeValuesPerDimension(dim: string): void {
    for (const [key, val] of this.stuDimToVals) {
      if (key.split(this.DELIMITER)[1] === dim) {
        this.stuDimToVals.delete(key);
      }
    }

    this.filteredDimensions = this.filteredDimensions.filter(
      (f) => f.dimension !== dim
    );

    this.modelData = this.modelData.filter((m) => m.dimension !== dim);
  }

  buildKey(userID: string, dimension: string): string {
    return userID + this.DELIMITER + dimension;
  }

  clearData(): void {
    this.importCSV = null;
    this.dimensions.clear();
    this.stuDimToVals.clear();
    this.modelData = [];
    this.filteredDimensions = [];
    this.selectedAssessment = null;
    this.selectedStudent = null;
  }

  onClose(): void {
    this.dialogRef.close();
  }

  async createModel(): Promise<void> {
    const model = await this.learnerService.createModel(
      this.data.board.projectID,
      this.data.board.boardID,
      this.name,
      Array.from(this.dimensions),
      this.modelData
    );
    this.data.onCreate(model);
    this.dialogRef.close();
  }
}
