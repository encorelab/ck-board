import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LearnerModelsComponent } from './learner-models.component';

describe('LearnerModelsComponent', () => {
  let component: LearnerModelsComponent;
  let fixture: ComponentFixture<LearnerModelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LearnerModelsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LearnerModelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
