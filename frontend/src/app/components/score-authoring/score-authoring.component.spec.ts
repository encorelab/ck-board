import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoreAuthoringComponent } from './score-authoring.component';

describe('ScoreAuthoringComponent', () => {
  let component: ScoreAuthoringComponent;
  let fixture: ComponentFixture<ScoreAuthoringComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScoreAuthoringComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScoreAuthoringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
