import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoveGroupMembersComponent } from './move-group-members.component';

describe('MoveGroupMembersComponent', () => {
  let component: MoveGroupMembersComponent;
  let fixture: ComponentFixture<MoveGroupMembersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MoveGroupMembersComponent],
      teardown: { destroyAfterEach: false },
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MoveGroupMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
