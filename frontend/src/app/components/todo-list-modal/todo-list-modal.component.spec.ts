import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TodoListModalComponent } from './todo-list-modal.component';

describe('TodoListModalComponent', () => {
  let component: TodoListModalComponent;
  let fixture: ComponentFixture<TodoListModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TodoListModalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TodoListModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
