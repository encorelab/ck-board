import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as Highcharts from 'highcharts';
import more from 'highcharts/highcharts-more';
import exporting from 'highcharts/modules/exporting';
import nodata from 'highcharts/modules/no-data-to-display';
import { Board } from 'src/app/models/board';
import LearnerModel, { DimensionType } from 'src/app/models/learner';
import { LearnerService } from 'src/app/services/learner.service';
import { createClassEngagementGraph } from 'src/app/utils/highchart';
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
  updateFlag: boolean = false;

  constructor(
    public learnerService: LearnerService,
    public dialog: MatDialog
  ) {}

  async ngOnInit(): Promise<void> {
    const models = await this.learnerService.getByBoards([this.board.boardID]);
    if (models?.length > 0) {
      this.engModel = models[0];
      this.refreshModel();
    }
  }

  toggleEngagementModel(): void {
    this.refreshModel();
  }

  refreshModel(): void {
    this.chartOptions = createClassEngagementGraph(
      this.engModel,
      {
        onEditData: () => {
          this.dialog.open(LearnerDataModalComponent, {
            data: {
              model: this.engModel,
              projectID: this.board.projectID,
              onUpdate: (model: LearnerModel) => {
                this.engModel = model;
                this.refreshModel();
              },
            },
            maxWidth: 1280,
          });
        },
        onEditDimensions: () => {
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
        },
      },
      this.dimensionType
    );
    this.updateFlag = true;
  }

  dimensionTypeChange(): void {
    this.refreshModel();
  }
}
