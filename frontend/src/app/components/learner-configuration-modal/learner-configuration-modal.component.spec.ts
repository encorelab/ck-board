import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LearnerConfigurationModalComponent } from './learner-configuration-modal.component';

describe('LearnerConfigurationModalComponent', () => {
  let component: LearnerConfigurationModalComponent;
  let fixture: ComponentFixture<LearnerConfigurationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LearnerConfigurationModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LearnerConfigurationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
