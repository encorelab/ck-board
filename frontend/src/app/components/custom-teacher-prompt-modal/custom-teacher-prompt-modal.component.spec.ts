import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomTeacherPromptModalComponent } from './custom-teacher-prompt-modal.component';

describe('CustomTeacherPromptModalComponent', () => {
  let component: CustomTeacherPromptModalComponent;
  let fixture: ComponentFixture<CustomTeacherPromptModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomTeacherPromptModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomTeacherPromptModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
