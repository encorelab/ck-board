import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoreRoomcastingEnvironmentComponent } from './score-roomcasting-environment.component';

describe('ScoreRoomcastingEnvironmentComponent', () => {
  let component: ScoreRoomcastingEnvironmentComponent;
  let fixture: ComponentFixture<ScoreRoomcastingEnvironmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScoreRoomcastingEnvironmentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScoreRoomcastingEnvironmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
