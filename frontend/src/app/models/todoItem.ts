import { Group } from './group';
import User from './user';

export enum TodoItemType {
  COGNITION = 'COGNITION',
  SEL = 'SEL',
  BEHAVIOURAL = 'BEHAVIOURAL',
  CLASS = 'CLASS',
}

export enum CompletionQuality {
  N_A = 'N_A',
  INCOMPLETE = 'INCOMPLETE',
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

export class TodoItem {
  todoItemID: string;
  projectID: string;
  userID: string;
  title: string;
  description?: string;
  groupID: string;
  type: TodoItemType[];
  completed!: boolean;
  quality?: CompletionQuality;
  deadline: Deadline;
  notifications!: string[];
  overdue: boolean;
}

export class ExpandedTodoItem {
  todoItem: TodoItem;
  group: Group;
  user: User;
}
