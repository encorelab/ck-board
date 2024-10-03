import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddLearnerModalComponent } from './add-learner-modal.component';

describe('AddLearnerModalComponent', () => {
  let component: AddLearnerModalComponent;
  let fixture: ComponentFixture<AddLearnerModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddLearnerModalComponent],
      teardown: { destroyAfterEach: false },
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddLearnerModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
