import { SeriesOptionsType } from 'highcharts';
import { LearnerConfigurationModalComponent } from '../components/learner-configuration-modal/learner-configuration-modal.component';
import { LearnerDataModalComponent } from '../components/learner-data-modal/learner-data-modal.component';
import LearnerModel, { DimensionValue } from '../models/learner';

export interface MenuHandlers {
  onEditDimensions: Function;
  onEditData: Function;
}

export const createClassEngagement = (
  model: LearnerModel,
  handlers: MenuHandlers
): Highcharts.Options => {
  const dimensions = model.dimensions;

  const series: SeriesOptionsType[] = [];
  for (const [studentID, values] of Object.entries(model.data)) {
    series.push({
      type: 'line',
      name: studentID,
      data: values.map((v) => v.diagnostic),
    });
  }
  // series.push({
  //   type: 'line',
  //   name: 'Student2',
  //   data: [30, 50],
  // });

  return {
    chart: {
      polar: true,
    },
    exporting: {
      buttons: {
        contextButton: {
          text: 'Edit Chart',
          menuItems: ['dimensions', 'data'],
        },
      },
      menuItemDefinitions: {
        dimensions: {
          text: 'Edit Dimensions',
          onclick: () => {
            handlers.onEditDimensions(model);
          },
        },
        data: {
          text: 'Edit Data',
          onclick: () => {
            handlers.onEditData(model);
          },
        },
      },
    },
    title: {
      text: 'Engagement Model',
    },
    xAxis: {
      categories: dimensions,
      tickmarkPlacement: 'on',
      lineWidth: 0,
    },
    yAxis: {
      gridLineInterpolation: 'polygon',
      lineWidth: 0,
      min: 0,
      max: 100,
    },
    tooltip: {
      shared: true,
      valueSuffix: '%',
    },
    series: series,
    // [
    //   {
    //     type: 'line',
    //     name: 'Student2',
    //     data: [30, 50, 20, 40, 50, 20],
    //   },
    //   {
    //     type: 'line',
    //     name: 'Student3',
    //     data: [30, 40, 20, 40, 30, 20],
    //   },
    //   {
    //     type: 'line',
    //     name: 'Student4',
    //     data: [60, 30, 20, 50, 30, 50],
    //   },
    // ],
  };
};
