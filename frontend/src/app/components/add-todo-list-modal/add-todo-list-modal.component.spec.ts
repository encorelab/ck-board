import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTodoListModalComponent } from './add-todo-list-modal.component';

describe('AddTodoListModalComponent', () => {
  let component: AddTodoListModalComponent;
  let fixture: ComponentFixture<AddTodoListModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddTodoListModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddTodoListModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
