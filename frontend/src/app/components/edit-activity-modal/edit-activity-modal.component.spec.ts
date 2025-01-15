import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditActivityModalComponent } from './edit-activity-modal.component';

describe('EditActivityModalComponent', () => {
  let component: EditActivityModalComponent;
  let fixture: ComponentFixture<EditActivityModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditActivityModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditActivityModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
