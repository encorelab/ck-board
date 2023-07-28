import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as Highcharts from 'highcharts';
import more from 'highcharts/highcharts-more';
import exporting from 'highcharts/modules/exporting';
import nodata from 'highcharts/modules/no-data-to-display';
import { Board } from 'src/app/models/board';
import { Project } from 'src/app/models/project';
import LearnerModel, { DimensionType } from 'src/app/models/learner';
import { AuthUser } from 'src/app/models/user';
import { LearnerService } from 'src/app/services/learner.service';
import { createClassGraph, createStudentGraph } from 'src/app/utils/highchart';
import { AddLearnerModalComponent } from '../add-learner-modal/add-learner-modal.component';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';
import { ProjectService } from 'src/app/services/project.service';
import * as saveAs from 'file-saver';
import { UserService } from 'src/app/services/user.service';

more(Highcharts);
exporting(Highcharts);
nodata(Highcharts);

Highcharts.setOptions({
  lang: {
    noData: 'No data available. Please specify dimension values for students.',
  },
});

export interface LearnerInput {
  board: Board;
}

export interface ModelCard {
  model: LearnerModel;
  dimensionType: DimensionType;
  chartOptions: Highcharts.Options;
  updateFlag: boolean;
}

@Component({
  selector: 'app-learner-models',
  templateUrl: './learner-models.component.html',
  styleUrls: ['./learner-models.component.scss'],
})
export class LearnerModelsComponent implements OnInit {
  @Input() board: Board;
  @Input() project: Project;
  @Input() studentView?: boolean = false;

  modelCards: ModelCard[] = [];

  DimensionType: typeof DimensionType = DimensionType;
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {};

  idToUser: Map<string, AuthUser> = new Map<string, AuthUser>();
  modelSubject: string = DimensionType.DIAGNOSTIC;
  classDimensionFilter: DimensionType = DimensionType.DIAGNOSTIC;

  updateFlag: boolean = false;

  constructor(
    public learnerService: LearnerService,
    public projectService: ProjectService,
    public userService: UserService,
    public dialog: MatDialog
  ) {}

  async ngOnInit(): Promise<void> {
    const models = await this.learnerService.getByProjects([
      this.project.projectID,
    ]);
    for (const model of models) {
      this.modelCards.push({
        model: model,
        dimensionType: DimensionType.DIAGNOSTIC,
        chartOptions: this.createChartOptions(model, !this.studentView),
        updateFlag: false,
      });
      model.data.map((d) => this.idToUser.set(d.student.userID, d.student));
    }
    if (this.studentView) {
      this.modelSubject = this.userService.user?.userID ?? '';
      this.subjectChange();
    }
  }

  createChartOptions(model: LearnerModel, enableExporting: boolean): Highcharts.Options {
    if (
      this.modelSubject == DimensionType.DIAGNOSTIC ||
      this.modelSubject == DimensionType.REASSESSMENT
    ) {
      return createClassGraph(
        model,
        {
          onEditData: this.onEditData,
          onExport: this.onExport,
          onDeleteModel: this.onDeleteModel,
        },
        this.modelSubject,
        enableExporting
      );
    } else {
      return createStudentGraph(
        model,
        {
          onEditData: this.onEditData,
          onExport: this.onExport,
          onDeleteModel: this.onDeleteModel,
        },
        this.idToUser.get(this.modelSubject)!,
        enableExporting
      );
    }
  }

  refreshModelCard(model: LearnerModel, modelCard?: ModelCard): void {
    if (!modelCard) {
      modelCard = this.modelCards.find(
        (m) => m.model.modelID === model.modelID
      );
    }
    if (modelCard) {
      modelCard.model = model;
      modelCard.chartOptions = this.createChartOptions(model, !this.studentView);
      modelCard.updateFlag = true;
    }
  }

  onEditData = (model: LearnerModel): void => {
    this.dialog.open(AddLearnerModalComponent, {
      data: {
        isEditing: true,
        model: model,
        board: this.board,
        selectedStudentID: this.modelSubject,
        onUpdate: (model: LearnerModel) => {
          this.refreshModelCard(model);
        },
      },
      minWidth: 720,
      maxWidth: 1280,
    });
  };

  onExport = async (model: LearnerModel): Promise<void> => {
    const rows: string[] = [
      'student_id,student_username,dimension,diagnostic,reassessment',
    ];
    model.data.forEach((value) => {
      const { userID, username } = value.student;
      rows.push(
        `${userID},${username},${value.dimension},${value.diagnostic},${value.reassessment}`
      );
    });
    const csvArray = rows.join('\r\n');
    const blob = new Blob([csvArray], { type: 'text/csv' });
    const projectName = (await this.projectService.get(this.board.projectID))
      .name;
    saveAs(blob, `${projectName}_${model.name}.csv`);
  };

  onDeleteModel = (model: LearnerModel): void => {
    this.dialog.open(ConfirmModalComponent, {
      width: '500px',
      data: {
        title: 'Confirmation',
        message: 'Are you sure you want to delete this learner model?',
        handleConfirm: async () => {
          await this.learnerService.deleteModel(model.modelID);
          this.modelCards = this.modelCards.filter(
            (m) => m.model.modelID !== model.modelID
          );
        },
      },
    });
  };

  dimensionTypeChange(modelCard: ModelCard): void {
    this.refreshModelCard(modelCard.model);
  }

  subjectChange(): void {
    this.modelCards.map((mc) => this.refreshModelCard(mc.model, mc));
  }

  dimTypeFilterChange(dim: DimensionType): void {
    this.classDimensionFilter = dim;
  }

  handleCreateModel(): void {
    this.dialog.open(AddLearnerModalComponent, {
      data: {
        isEditing: false,
        board: this.board,
        onCreate: (model: LearnerModel) => {
          this.modelCards.push({
            model: model,
            dimensionType: DimensionType.DIAGNOSTIC,
            chartOptions: this.createChartOptions(model, !this.studentView),
            updateFlag: false,
          });
          model.data.map((d) => this.idToUser.set(d.student.userID, d.student));
        },
      },
      minWidth: 720,
      maxWidth: 1280,
    });
  }
}
