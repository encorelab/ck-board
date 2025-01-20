import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectAiAgentModalComponent } from './select-ai-agent-modal.component';

describe('SelectAiAgentModalComponent', () => {
  let component: SelectAiAgentModalComponent;
  let fixture: ComponentFixture<SelectAiAgentModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectAiAgentModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectAiAgentModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
