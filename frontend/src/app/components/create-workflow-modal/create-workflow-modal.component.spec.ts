import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateWorkflowModalComponent } from './create-workflow-modal.component';

describe('CreateWorkflowModalComponent', () => {
  let component: CreateWorkflowModalComponent;
  let fixture: ComponentFixture<CreateWorkflowModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateWorkflowModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateWorkflowModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
