import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectWorkflowModalComponent } from './select-workflow-modal.component';

describe('SelectWorkflowModalComponent', () => {
  let component: SelectWorkflowModalComponent;
  let fixture: ComponentFixture<SelectWorkflowModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectWorkflowModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectWorkflowModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
