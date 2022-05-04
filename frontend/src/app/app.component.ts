import { Component } from '@angular/core';
import { CanvasService } from './services/canvas.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  
  constructor(canc: CanvasService) {
    
  }
}
