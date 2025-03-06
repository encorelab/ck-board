import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CkIdeasComponent } from './ck-ideas.component';

describe('CkIdeasComponent', () => {
  let component: CkIdeasComponent;
  let fixture: ComponentFixture<CkIdeasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CkIdeasComponent],
      teardown: { destroyAfterEach: false },
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CkIdeasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
