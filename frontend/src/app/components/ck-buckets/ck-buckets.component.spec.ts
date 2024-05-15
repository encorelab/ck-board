import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CkBucketsComponent } from './ck-buckets.component';

describe('CkBucketsComponent', () => {
  let component: CkBucketsComponent;
  let fixture: ComponentFixture<CkBucketsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    declarations: [CkBucketsComponent],
    teardown: { destroyAfterEach: false }
}).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CkBucketsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
