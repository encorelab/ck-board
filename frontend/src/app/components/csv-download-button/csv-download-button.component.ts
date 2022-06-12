import { Component, Input, OnInit } from '@angular/core';
import { parseAsync } from 'json2csv';
import { TraceService } from 'src/app/services/trace.service';
import traceDefaults from './traceDefaults';

@Component({
  selector: 'app-csv-download-button',
  templateUrl: './csv-download-button.component.html',
  styleUrls: ['./csv-download-button.component.scss'],
})
export class CsvDownloadButtonComponent implements OnInit {
  @Input() projectID: string;

  private static readonly CSV_FILENAME: string = 'CK_Trace.csv';

  constructor(private traceService: TraceService) {}

  ngOnInit(): void {}
  /**
   * Converts csv string to csv file an downloads it
   * @param csvContent Csv string to convert and download
   */
  downloadCSV(csvContent: string): void {
    const encodedUri = encodeURIComponent(csvContent);
    // create a dummy link element
    const link = document.createElement('a');
    link.setAttribute('href', 'data:attachment/csv,' + encodedUri);
    link.setAttribute('download', CsvDownloadButtonComponent.CSV_FILENAME);
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
