import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CkWorkspaceComponent } from './ck-workspace.component';

describe('CkWorkspaceComponent', () => {
  let component: CkWorkspaceComponent;
  let fixture: ComponentFixture<CkWorkspaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    declarations: [CkWorkspaceComponent],
    teardown: { destroyAfterEach: false }
}).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CkWorkspaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
