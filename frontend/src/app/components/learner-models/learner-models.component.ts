import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as Highcharts from 'highcharts';
import more from 'highcharts/highcharts-more';
import exporting from 'highcharts/modules/exporting';
import nodata from 'highcharts/modules/no-data-to-display';
import { Board } from 'src/app/models/board';
import LearnerModel, { DimensionType } from 'src/app/models/learner';
import { AuthUser } from 'src/app/models/user';
import { LearnerService } from 'src/app/services/learner.service';
import { createClassGraph, createStudentGraph } from 'src/app/utils/highchart';
import { AddLearnerModalComponent } from '../add-learner-modal/add-learner-modal.component';
import { LearnerConfigurationModalComponent } from '../learner-configuration-modal/learner-configuration-modal.component';
import { LearnerDataModalComponent } from '../learner-data-modal/learner-data-modal.component';

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

  modelCards: ModelCard[] = [];

  DimensionType: typeof DimensionType = DimensionType;
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {};

  idToUser: Map<string, AuthUser> = new Map<string, AuthUser>();
  modelSubject: AuthUser | null;

  updateFlag: boolean = false;

  constructor(
    public learnerService: LearnerService,
    public dialog: MatDialog
  ) {}

  async ngOnInit(): Promise<void> {
    const models = await this.learnerService.getByBoards([this.board.boardID]);
    for (const model of models) {
      this.modelCards.push({
        model: model,
        dimensionType: DimensionType.DIAGNOSTIC,
        chartOptions: this.createChartOptions(model),
        updateFlag: false,
      });
      model.data.map((d) => this.idToUser.set(d.student.userID, d.student));
    }
  }

  createChartOptions(
    model: LearnerModel,
    dimType = DimensionType.DIAGNOSTIC
  ): Highcharts.Options {
    if (!this.modelSubject) {
      return createClassGraph(
        model,
        {
          onEditData: this.onEditData,
          onEditDimensions: this.onEditDimensions,
        },
        dimType
      );
    } else {
      return createStudentGraph(
        model,
        {
          onEditData: this.onEditData,
          onEditDimensions: this.onEditDimensions,
        },
        this.modelSubject
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
      modelCard.chartOptions = this.createChartOptions(
        model,
        modelCard.dimensionType
      );
      modelCard.updateFlag = true;
    }
  }

  onEditData = (model: LearnerModel): void => {
    this.dialog.open(LearnerDataModalComponent, {
      data: {
        model: model,
        projectID: this.board.projectID,
        selectedStudentID: this.modelSubject?.userID,
        onUpdate: (model: LearnerModel) => {
          this.refreshModelCard(model);
        },
      },
      maxWidth: 1280,
    });
  };

  onEditDimensions = (model: LearnerModel) => {
    this.dialog.open(LearnerConfigurationModalComponent, {
      data: {
        model: model,
        onUpdate: (model: LearnerModel) => {
          this.refreshModelCard(model);
        },
      },
      maxWidth: 1280,
    });
  };

  dimensionTypeChange(modelCard: ModelCard): void {
    this.refreshModelCard(modelCard.model);
  }

  subjectChange(): void {
    this.modelCards.map((mc) => this.refreshModelCard(mc.model, mc));
  }

  disableDimensionFilter(): boolean {
    return this.modelSubject != null;
  }

  handleCreateModel(): void {
    this.dialog.open(AddLearnerModalComponent, {
      data: {
        board: this.board,
        onCreate: (model: LearnerModel) => {
          this.modelCards.push({
            model: model,
            dimensionType: DimensionType.DIAGNOSTIC,
            chartOptions: this.createChartOptions(model),
            updateFlag: false,
          });
          model.data.map((d) => this.idToUser.set(d.student.userID, d.student));
        },
      },
      minWidth: 480,
      maxWidth: 1280,
    });
  }
}
