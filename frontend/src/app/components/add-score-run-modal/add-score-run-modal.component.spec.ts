import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddScoreRunModalComponent } from './add-score-run-modal.component';

describe('AddScoreRunModalComponent', () => {
  let component: AddScoreRunModalComponent;
  let fixture: ComponentFixture<AddScoreRunModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddScoreRunModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddScoreRunModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
