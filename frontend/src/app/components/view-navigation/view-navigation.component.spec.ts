import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewNavigationComponent } from './view-navigation.component';

describe('ViewNavigationComponent', () => {
  let component: ViewNavigationComponent;
  let fixture: ComponentFixture<ViewNavigationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    declarations: [ViewNavigationComponent],
    teardown: { destroyAfterEach: false }
}).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
