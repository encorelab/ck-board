import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerateApiModalComponent } from './generate-api-modal.component';

describe('GenerateApiModalComponent', () => {
  let component: GenerateApiModalComponent;
  let fixture: ComponentFixture<GenerateApiModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GenerateApiModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenerateApiModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
