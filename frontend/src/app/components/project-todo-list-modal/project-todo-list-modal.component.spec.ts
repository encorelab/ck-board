import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectTodoListModalComponent } from './project-todo-list-modal.component';

describe('ProjectTodoListModalComponent', () => {
  let component: ProjectTodoListModalComponent;
  let fixture: ComponentFixture<ProjectTodoListModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProjectTodoListModalComponent],
      teardown: { destroyAfterEach: false },
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectTodoListModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
