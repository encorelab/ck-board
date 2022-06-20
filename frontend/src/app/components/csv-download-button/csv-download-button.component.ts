import { Component, Input, OnInit } from '@angular/core';
import { parseAsync } from 'json2csv';
import { TraceService } from 'src/app/services/trace.service';
import traceDefaults from './traceDefaults';
import * as dayjs from 'dayjs';
import { ProjectService } from 'src/app/services/project.service';
import { Project } from 'src/app/models/project';

@Component({
  selector: 'app-csv-download-button',
  templateUrl: './csv-download-button.component.html',
  styleUrls: ['./csv-download-button.component.scss'],
})
export class CsvDownloadButtonComponent implements OnInit {
  @Input() projectID: string;
  project: Project;

  constructor(
    private traceService: TraceService,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.projectService.get(this.projectID).then((project) => {
      this.project = project;
    });
  }
  /**
   * Converts csv string to csv file an downloads it
   * @param csvContent Csv string to convert and download
   */
  downloadCSV(csvContent: string): void {
    const encodedUri = encodeURIComponent(csvContent);
    // create a dummy link element to store csvContent
    const link = document.createElement('a');
    link.setAttribute('href', 'data:attachment/csv,' + encodedUri);
    const dateString = dayjs().format('YYYY-MM-DD [at] hh.mm.ss A');
    let fileName = 'CK_Trace ' + this.project.name + ' ' + dateString + '.csv';
    fileName = fileName.replace(/\s/g, '_');
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    // click created link to dowload csv
    link.click();
  }
  /**
   * Fetches traces from backend and exports the data to a csv file
   */
  async exportToCSV(): Promise<void> {
    const traceCollection = await this.traceService.getTraceRecords(
      this.projectID
    );
    const traceData: any[] = [];
    traceCollection.forEach((data) => {
      // for each trace, extract nested event object and flatten it
      // before passing it to json2csv
      const { event, ...otherfields } = data;
      traceData.push({
        ...otherfields,
        ...event,
      });
    });
    // set defaults for fields and rename fields using traceDefaults
    const csvContent = await parseAsync(traceData, { fields: traceDefaults });
    this.downloadCSV(csvContent);
  }
}
