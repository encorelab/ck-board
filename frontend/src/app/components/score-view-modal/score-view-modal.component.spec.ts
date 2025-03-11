import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoreViewModalComponent } from './score-view-modal.component';

describe('ScoreViewModalComponent', () => {
  let component: ScoreViewModalComponent;
  let fixture: ComponentFixture<ScoreViewModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScoreViewModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScoreViewModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
