import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinProjectModalComponent } from './join-project-modal.component';

describe('JoinProjectModalComponent', () => {
  let component: JoinProjectModalComponent;
  let fixture: ComponentFixture<JoinProjectModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [JoinProjectModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JoinProjectModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
