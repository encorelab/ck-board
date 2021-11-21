import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JoinBoardModalComponent } from './join-board-modal.component';

describe('JoinBoardModalComponent', () => {
  let component: JoinBoardModalComponent;
  let fixture: ComponentFixture<JoinBoardModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ JoinBoardModalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JoinBoardModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
