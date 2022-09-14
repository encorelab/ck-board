import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectNotificationDropdownComponent } from './project-notification-dropdown.component';

describe('ProjectNotificationDropdownComponent', () => {
  let component: ProjectNotificationDropdownComponent;
  let fixture: ComponentFixture<ProjectNotificationDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjectNotificationDropdownComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectNotificationDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
