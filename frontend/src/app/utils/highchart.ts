import { SeriesOptionsType } from 'highcharts';
import LearnerModel, { DimensionType, DimensionValue } from '../models/learner';
import { AuthUser } from '../models/user';
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
          text: 'Edit Model',
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

export const createStudentEngagementGraph = (
  model: LearnerModel,
  handlers: MenuHandlers,
  student: AuthUser
): Highcharts.Options => {
  const dimToData: Map<string, DimensionValue[]> = sorting.groupItemBy(
    model.data,
    'dimension'
  );

  const dimensions: string[] = [];
  const studentDiagnostics: number[] = [];
  const studentReassessments: number[] = [];
  const averageDiagnostics: number[] = [];
  const averageReassessments: number[] = [];
  for (const [dimension, values] of Object.entries(dimToData)) {
    dimensions.push(dimension);
    let sumDiagnostics = 0;
    let sumReassessments = 0;
    let numValues = 0;
    for (const value of values) {
      numValues += 1;
      sumDiagnostics += value.diagnostic;
      sumReassessments += value.reassessment;
      if (value.student.userID === student.userID) {
        studentDiagnostics.push(value.diagnostic);
        studentReassessments.push(value.reassessment);
      }
    }
    averageDiagnostics.push(sumDiagnostics / numValues);
    averageReassessments.push(sumReassessments / numValues);
  }

  const series: SeriesOptionsType[] = [];
  series.push({
    type: 'area',
    name: 'Diagnostic',
    data: studentDiagnostics,
  });
  series.push({
    type: 'area',
    name: 'Reassessment',
    data: studentReassessments,
  });
  series.push({
    type: 'line',
    name: 'Average Diagnostic',
    data: averageDiagnostics,
  });
  series.push({
    type: 'line',
    name: 'Average Reassessment',
    data: averageReassessments,
  });

  return {
    chart: {
      polar: true,
    },
    exporting: {
      buttons: {
        contextButton: {
          text: 'Edit Model',
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
      text: `${student.username}'s Engagement Model`,
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
