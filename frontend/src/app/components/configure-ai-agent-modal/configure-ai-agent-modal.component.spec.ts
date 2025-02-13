import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigureAiAgentModalComponent } from './configure-ai-agent-modal.component';

describe('ConfigureAiAgentModalComponent', () => {
  let component: ConfigureAiAgentModalComponent;
  let fixture: ComponentFixture<ConfigureAiAgentModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ConfigureAiAgentModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigureAiAgentModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
