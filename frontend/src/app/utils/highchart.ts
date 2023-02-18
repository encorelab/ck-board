import { SeriesOptionsType } from 'highcharts';
import LearnerModel, { DimensionType, DimensionValue } from '../models/learner';
import sorting from './sorting';

export interface MenuHandlers {
  onEditDimensions: Function;
  onEditData: Function;
}

export const createClassEngagementGraph = (
  model: LearnerModel,
  handlers: MenuHandlers,
  dimensionType: DimensionType = DimensionType.DIAGNOSTIC
): Highcharts.Options => {
  const dimensions = model.dimensions;
  const studentToDims: Map<string, DimensionValue[]> = sorting.groupItemBy(
    model.data,
    'student.username'
  );

  const series: SeriesOptionsType[] = [];
  for (const [student, values] of Object.entries(studentToDims)) {
    series.push({
      type: 'line',
      name: student,
      data: values.map((v: DimensionValue) =>
        dimensionType === DimensionType.DIAGNOSTIC
          ? v.diagnostic
          : v.reassessment
      ),
    });
  }

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
  };
};
