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
    if (this.projectID) {
      this.projectService
        .get(this.projectID)
        .then((project) => {
          if (project) {
            this.project = project;
          } else {
            console.error('Project not found');
            // Handle the case where the project is not found
          }
        })
        .catch((error) => {
          console.error('Error fetching project:', error);
          // Handle the case where the request fails
        });
    } else {
      console.error('No projectID provided');
      // Handle the case where no projectID is provided
    }
  }

  /**
   * Converts csv string to csv file and downloads it
   * @param csvContent Csv string to convert and download
   */
  downloadCSV(csvContent: string): void {
    if (this.project && this.project.name) {
      const encodedUri = encodeURIComponent(csvContent);
      // Create a dummy link element to store csvContent
      const link = document.createElement('a');
      link.setAttribute('href', 'data:attachment/csv,' + encodedUri);
      const dateString = dayjs().format('YYYY-MM-DD [at] hh.mm.ss A');
      let fileName =
        'CK_Trace_' + this.project.name + '_' + dateString + '.csv';
      fileName = fileName.replace(/\s/g, '_');
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      // Click created link to download CSV
      link.click();
      document.body.removeChild(link); // Clean up the DOM
    } else {
      console.error('Project name is missing');
      // Handle the case where project name is missing
    }
  }

  /**
   * Fetches traces from backend and exports the data to a csv file
   */
  async exportToCSV(): Promise<void> {
    if (this.projectID) {
      try {
        const traceCollection = await this.traceService.getTraceRecords(
          this.projectID
        );
        if (traceCollection) {
          const traceData: any[] = [];
          traceCollection.forEach((data) => {
            if (data) {
              // For each trace, extract nested event object and flatten it
              // before passing it to json2csv
              const { event, ...otherfields } = data;
              traceData.push({
                ...otherfields,
                ...event,
              });
            }
          });
          // Set defaults for fields and rename fields using traceDefaults
          const csvContent = await parseAsync(traceData, {
            fields: traceDefaults,
          });
          this.downloadCSV(csvContent);
        } else {
          console.error('No trace records found');
          // Handle the case where no trace records are found
        }
      } catch (error) {
        console.error('Error fetching trace records:', error);
        // Handle the case where the request fails
      }
    } else {
      console.error('No projectID provided for exporting CSV');
      // Handle the case where no projectID is provided
    }
  }
}
