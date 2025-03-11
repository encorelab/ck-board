import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowJoinCodeComponent } from './show-join-code.component';

describe('ShowJoinCodeComponent', () => {
  let component: ShowJoinCodeComponent;
  let fixture: ComponentFixture<ShowJoinCodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShowJoinCodeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowJoinCodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
