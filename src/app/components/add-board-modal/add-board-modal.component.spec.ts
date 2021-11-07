import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddBoardModalComponent } from './add-board-modal.component';

describe('AddBoardModalComponent', () => {
  let component: AddBoardModalComponent;
  let fixture: ComponentFixture<AddBoardModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddBoardModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddBoardModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
