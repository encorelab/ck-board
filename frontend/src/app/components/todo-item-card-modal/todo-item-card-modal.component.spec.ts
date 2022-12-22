import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TodoItemCardModalComponent } from './todo-item-card-modal.component';

describe('TodoItemCardModalComponent', () => {
  let component: TodoItemCardModalComponent;
  let fixture: ComponentFixture<TodoItemCardModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TodoItemCardModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TodoItemCardModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
