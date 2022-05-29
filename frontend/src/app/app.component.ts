import { Component } from '@angular/core';
import { TracingService } from './services/tracing.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(public tracingService: TracingService) {}
}
