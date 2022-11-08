class Deadline {
  time: string;
  date: string;
}

export class TodoItem {
  todoItemID: string;
  projectID: string;
  userID: string;
  title: string;
  completed: boolean;
  deadline: Deadline;
  notifications!: string[];
  overdue: boolean;
}
