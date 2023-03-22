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
import {
  createClassEngagementGraph,
  createStudentEngagementGraph,
} from 'src/app/utils/highchart';
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

@Component({
  selector: 'app-learner-models',
  templateUrl: './learner-models.component.html',
  styleUrls: ['./learner-models.component.scss'],
})
export class LearnerModelsComponent implements OnInit {
  @Input() board: Board;

  engModel: LearnerModel;

  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {};

  DimensionType: typeof DimensionType = DimensionType;
  dimensionType: DimensionType = DimensionType.DIAGNOSTIC;

  idToUser: Map<string, AuthUser> = new Map<string, AuthUser>();
  modelSubject: AuthUser | null;

  updateFlag: boolean = false;

  constructor(
    public learnerService: LearnerService,
    public dialog: MatDialog
  ) {}

  async ngOnInit(): Promise<void> {
    const models = await this.learnerService.getByBoards([this.board.boardID]);
    if (models?.length > 0) {
      this.engModel = models[0];
      models[0].data.map((d) => this.idToUser.set(d.student.userID, d.student));
      this.refreshModel();
    }
  }

  refreshModel(): void {
    if (!this.modelSubject) {
      this.chartOptions = createClassEngagementGraph(
        this.engModel,
        {
          onEditData: this.onEditData,
          onEditDimensions: this.onEditDimensions,
        },
        this.dimensionType
      );
    } else {
      this.chartOptions = createStudentEngagementGraph(
        this.engModel,
        {
          onEditData: this.onEditData,
          onEditDimensions: this.onEditDimensions,
        },
        this.modelSubject
      );
    }

    this.updateFlag = true;
  }

  onEditData = (): void => {
    this.dialog.open(LearnerDataModalComponent, {
      data: {
        model: this.engModel,
        projectID: this.board.projectID,
        selectedStudentID: this.modelSubject?.userID,
        onUpdate: (model: LearnerModel) => {
          this.engModel = model;
          this.refreshModel();
        },
      },
      maxWidth: 1280,
    });
  };

  onEditDimensions = () => {
    this.dialog.open(LearnerConfigurationModalComponent, {
      data: {
        model: this.engModel,
        onUpdate: (model) => {
          this.engModel = model;
          this.refreshModel();
        },
      },
      maxWidth: 1280,
    });
  };

  dimensionTypeChange(): void {
    this.refreshModel();
  }

  modelSubjectChange(): void {
    this.refreshModel();
  }

  disableDimensionFilter(): boolean {
    return this.modelSubject != null;
  }
}
