import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CsvDownloadButtonComponent } from './csv-download-button.component';

describe('CsvDownloadButtonComponent', () => {
  let component: CsvDownloadButtonComponent;
  let fixture: ComponentFixture<CsvDownloadButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CsvDownloadButtonComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CsvDownloadButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
