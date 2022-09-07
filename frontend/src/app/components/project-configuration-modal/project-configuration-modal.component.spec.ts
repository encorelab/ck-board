import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectConfigurationModalComponent } from './project-configuration-modal.component';

describe('ProjectConfigurationModalComponent', () => {
  let component: ProjectConfigurationModalComponent;
  let fixture: ComponentFixture<ProjectConfigurationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjectConfigurationModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectConfigurationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
