import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CkMonitorComponent } from './ck-monitor.component';

describe('CkMonitorComponent', () => {
  let component: CkMonitorComponent;
  let fixture: ComponentFixture<CkMonitorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CkMonitorComponent],
      teardown: { destroyAfterEach: false },
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CkMonitorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
