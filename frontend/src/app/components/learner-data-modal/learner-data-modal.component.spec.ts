import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LearnerDataModalComponent } from './learner-data-modal.component';

describe('LearnerDataModalComponent', () => {
  let component: LearnerDataModalComponent;
  let fixture: ComponentFixture<LearnerDataModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LearnerDataModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LearnerDataModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
