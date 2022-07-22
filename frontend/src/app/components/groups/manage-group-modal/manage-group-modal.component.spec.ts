import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageGroupModalComponent } from './manage-group-modal.component';

describe('ManageGroupModalComponent', () => {
  let component: ManageGroupModalComponent;
  let fixture: ComponentFixture<ManageGroupModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ManageGroupModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageGroupModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
