import { SeriesOptionsType } from 'highcharts';
import LearnerModel, { DimensionType, DimensionValue } from '../models/learner';
import { AuthUser } from '../models/user';
import sorting from './sorting';

const FILL_OPACITY = 0.6;

export interface MenuHandlers {
  onEditData: Function;
  onExport: Function;
  onDeleteModel: Function;
}

export const createClassGraph = (
  model: LearnerModel,
  handlers: MenuHandlers,
  dimensionType: DimensionType = DimensionType.DIAGNOSTIC,
  enableExporting: boolean = true
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
      enabled: enableExporting,
      buttons: {
        contextButton: {
          text: 'Edit Model',
          menuItems: ['data', 'export', 'delete'],
        },
      },
      menuItemDefinitions: {
        data: {
          text: 'Edit Data',
          onclick: () => {
            handlers.onEditData(model);
          },
        },
        export: {
          text: 'Export as CSV',
          onclick: () => {
            handlers.onExport(model);
          },
        },
        delete: {
          text: 'Delete Model',
          onclick: () => {
            handlers.onDeleteModel(model);
          },
        },
      },
    },
    title: {
      text: model.name,
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

export const createStudentGraph = (
  model: LearnerModel,
  handlers: MenuHandlers,
  student: AuthUser,
  enableExporting: boolean = true
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
    name: 'Reassessment',
    data: studentReassessments,
    opacity: FILL_OPACITY,
  });
  series.push({
    type: 'area',
    name: 'Diagnostic',
    data: studentDiagnostics,
    opacity: FILL_OPACITY,
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
      enabled: enableExporting,
      buttons: {
        contextButton: {
          text: 'Edit Model',
          menuItems: ['data', 'export', 'delete'],
        },
      },
      menuItemDefinitions: {
        data: {
          text: 'Edit Data',
          onclick: () => {
            handlers.onEditData(model);
          },
        },
        export: {
          text: 'Export as CSV',
          onclick: () => {
            handlers.onExport(model);
          },
        },
        delete: {
          text: 'Delete Model',
          onclick: () => {
            handlers.onDeleteModel(model);
          },
        },
      },
    },
    title: {
      text: model.name,
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
