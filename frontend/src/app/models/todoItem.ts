export enum TodoItemType {
  COGNITION = 'COGNITION',
  SEL = 'SEL',
  BEHAVIOURAL = 'BEHAVIOURAL',
  CLASS = 'CLASS',
}

class Deadline {
  time: string;
  date: string;
}

export class TodoItem {
  todoItemID: string;
  projectID: string;
  userID: string;
  title: string;
  groupID: string;
  type: TodoItemType[];
  completed: boolean;
  deadline: Deadline;
  notifications!: string[];
  overdue: boolean;
}
