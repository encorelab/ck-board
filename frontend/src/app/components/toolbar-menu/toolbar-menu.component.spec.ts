import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolbarMenuComponent } from './toolbar-menu.component';

describe('ToolbarMenuComponent', () => {
  let component: ToolbarMenuComponent;
  let fixture: ComponentFixture<ToolbarMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ToolbarMenuComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ToolbarMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
