import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BucketPostComponent } from './html-post.component';

describe('BucketPostComponent', () => {
  let component: BucketPostComponent;
  let fixture: ComponentFixture<BucketPostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BucketPostComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BucketPostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
