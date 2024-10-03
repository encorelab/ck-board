import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialog as MatDialog,
} from '@angular/material/legacy-dialog';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { Board } from 'src/app/models/board';
import LearnerModel, { DimensionValue } from 'src/app/models/learner';
import { AuthUser, Role } from 'src/app/models/user';
import { LearnerService } from 'src/app/services/learner.service';
import { UserService } from 'src/app/services/user.service';
import { MyErrorStateMatcher } from 'src/app/utils/ErrorStateMatcher';
import * as saveAs from 'file-saver';
import { MatLegacyPaginator as MatPaginator } from '@angular/material/legacy-paginator';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';

export interface StudentElement {
  id: string;
  username: string;
}

export interface AddLearnerInput {
  isEditing: boolean;
  board: Board;

  onCreate?: Function;

  model?: LearnerModel;
  selectedStudentID?: string;
  onUpdate?: Function;
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
  @ViewChild(MatPaginator) paginator: MatPaginator;

  name: string = '';

  newDimensionText: string = '';
  dimensions: Set<string> = new Set<string>();

  modelData: DimensionValue[] = [];
  stuDimToVals: Map<string, DimensionValue> = new Map<string, DimensionValue>();
  DELIMITER = ',,,';

  modelDataInputType: DataInputMethod = DataInputMethod.MANUAL_ENTRY;
  importCSV: any = null;
  filteredDimensions: DimensionValue[] = [];
  selectedStudent: AuthUser | null;
  selectedAssessment: string | null;

  showCSVHelp: boolean = false;
  isError = false;
  errorMessage = '';
  displayedColumns: string[] = ['username', 'id'];
  tableData: StudentElement[] = [];
  dataSource: MatTableDataSource<StudentElement> = new MatTableDataSource();
  template: string = `# student_id, student_username, dimension, diagnostic, reassessment
06e209ee-0500-4777-bb6a-9cd44a74dd80, CarterJones, Dimension 1, 23, 45
06e209ee-0500-4777-bb6a-9cd44a74dd80, AbbyCruise, Dimension 2, 76, 54`;

  idToStudent: Map<string, AuthUser> = new Map<string, AuthUser>();
  nameControl = new UntypedFormControl('', [
    Validators.required,
    Validators.maxLength(50),
  ]);
  matcher = new MyErrorStateMatcher();

  constructor(
    public dialogRef: MatDialogRef<AddLearnerModalComponent>,
    private dialog: MatDialog,
    private userService: UserService,
    private learnerService: LearnerService,
    @Inject(MAT_DIALOG_DATA) public data: AddLearnerInput
  ) {
    if (data.isEditing && data.model) {
      this.name = data.model.name;
      this.modelData = data.model.data;
      data.model.dimensions.map((d) => this.dimensions.add(d));
      data.model.data.map((d) => {
        this.stuDimToVals.set(this.buildKey(d.student.userID, d.dimension), d);
      });
    }
  }

  async ngOnInit(): Promise<void> {
    (await this.userService.getByProject(this.data.board.projectID)).map(
      (u) => {
        if (this.data.isEditing && u.userID === this.data.selectedStudentID) {
          this.selectedStudent = u;
          this.selectedAssessment = 'Diagnostic';
          this.studentChange();
        }
        if (u.role == Role.STUDENT) {
          this.idToStudent.set(u.userID, u);
        }
      }
    );
    this.createStudentInfoTable();
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
    this.dialog.open(ConfirmModalComponent, {
      width: '500px',
      data: {
        title: 'WARNING',
        message:
          'This action will delete this dimension for all students including all associated data.',
        handleConfirm: async () => {
          this.dimensions.delete(dimension);
          this.removeValuesPerDimension(dimension);
        },
      },
    });
  }

  onFileSelected(event: any): void {
    this.importCSV = event.target.files[0] ?? null;
    this.showCSVHelp = false;
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      const result = fileReader.result;
      if (typeof result !== 'string') {
        return;
      }
      for (const row of result.split('\n').splice(1)) {
        const values = row.split(',');
        const student = this.idToStudent.get(values[0]);
        const diagnostic = Number(values[3]);
        const reassessment = Number(values[4]);

        if (!student) {
          this.showError(
            `Student with ID: ${values[0]} does not exist. Please ensure the file is properly formatted based on the template below.`
          );
          this.showCSVHelp = true;
          this.clearData();
          return;
        } else if (
          isNaN(diagnostic) ||
          isNaN(reassessment) ||
          diagnostic < 0 ||
          diagnostic > 100 ||
          reassessment < 0 ||
          reassessment > 100
        ) {
          this.showError(
            `The diagnostic or reassessment values should be numbers between 0-100 (inclusive).`
          );
          this.showCSVHelp = true;
          this.clearData();
          return;
        }

        this.dimensions.add(values[2]);
        const dimValue = {
          student: student,
          dimension: values[2],
          diagnostic: Number(values[3]),
          reassessment: Number(values[4]),
        };
        this.stuDimToVals.set(this.buildKey(values[0], values[2]), dimValue);
        this.modelData.push(dimValue);
      }
      for (const dim of this.dimensions) {
        this.createValuesPerDimension(dim);
      }
      this.hideError();
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

  askToClearData(): void {
    this.dialog.open(ConfirmModalComponent, {
      width: '500px',
      data: {
        title: 'WARNING',
        message: 'This action will remove all dimensions and associated data.',
        handleConfirm: async () => {
          this.clearData();
        },
      },
    });
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

  showError(message: string): void {
    this.isError = true;
    this.errorMessage = message;
  }

  hideError(): void {
    this.isError = false;
    this.errorMessage = '';
  }

  createStudentInfoTable(): void {
    this.idToStudent.forEach((user, id) => {
      this.tableData.push({ id, username: user.username });
    });
    this.dataSource = new MatTableDataSource(this.tableData);
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  exportStudentInfo(): void {
    const rows: string[] = [
      'student_id,student_username,dimension,diagnostic,reassessment',
    ];
    this.idToStudent.forEach((user, id) => {
      rows.push(`${id},${user.username},Sample Dimension, 0, 0`);
    });
    const csvArray = rows.join('\r\n');
    const blob = new Blob([csvArray], { type: 'text/csv' });
    saveAs(blob, `${this.data.board.projectID}_student_info.csv`);
  }

  toggleCSVHelp(): void {
    this.showCSVHelp = !this.showCSVHelp;
  }

  onClose(): void {
    this.dialogRef.close();
  }

  async updateModel(): Promise<void> {
    if (this.data.isEditing && this.data.onUpdate && this.data.model) {
      const model = await this.learnerService.updateModel(
        this.data.model.modelID,
        this.name,
        Array.from(this.dimensions),
        this.modelData
      );
      this.data.onUpdate(model);
      this.dialogRef.close();
    }
  }

  async createModel(): Promise<void> {
    if (!this.data.isEditing && this.data.onCreate) {
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
}
