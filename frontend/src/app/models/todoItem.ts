export enum TodoItemType {
  CONTENT = 'CONTENT',
  SEL = 'SEL',
  ENGAGEMENT = 'ENGAGEMENT',
  CLASS = 'CLASS',
}

export enum CompletionQuality {
  N_A = 'N_A',
  VERY_UNSATISFIED = 'VERY_UNSATISFIED',
  UNSATISFIED = 'UNSATISFIED',
  NEUTRAL = 'NEUTRAL',
  SATISFIED = 'SATISFIED',
  VERY_SATISFIED = 'VERY_SATISFIED',
}

class Deadline {
  time: string;
  date: string;
}

class TodoStatus {
  completed!: boolean;
  quality!: CompletionQuality;
}

export class TodoItem {
  todoItemID: string;
  projectID: string;
  userID: string;
  title: string;
  description?: string;
  groupID: string;
  type: TodoItemType[];
  todoStatus: TodoStatus;
  deadline: Deadline;
  notifications!: string[];
  overdue: boolean;
}
