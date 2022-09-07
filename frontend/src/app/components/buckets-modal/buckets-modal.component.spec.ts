import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BucketsModalComponent } from './buckets-modal.component';

describe('BucketsModalComponent', () => {
  let component: BucketsModalComponent;
  let fixture: ComponentFixture<BucketsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BucketsModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BucketsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
