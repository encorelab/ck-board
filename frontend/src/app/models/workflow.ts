export enum ContainerType {
  BOARD = 'BOARD',
  BUCKET = 'BUCKET',
}

export class Container {
  type: ContainerType;
  id: string;
  name: string;
}

export enum WorkflowType {
  DISTRIBUTION = 'DISTRIBUTION',
  TASK = 'TASK',
}

export enum TaskActionType {
  COMMENT = 'COMMENT',
  TAG = 'TAG',
}

export enum GroupTaskStatus {
  INACTIVE = 'INACTIVE',
  ACTIVE = 'ACTIVE',
  COMPLETE = 'COMPLETE',
}

export class TaskAction {
  type: TaskActionType;
  amountRequired: number;
}

export type GroupTaskEntity = 'default' | 'expanded';

export type GroupTaskType<T> = T extends 'default'
  ? GroupTask
  : T extends 'expanded'
  ? ExpandedGroupTask
  : never;

export class GroupTask {
  groupTaskID: string;
  groupID: string;
  workflowID: string;
  posts: string[];
  progress: Map<string, TaskAction[]>;
  status: GroupTaskStatus;
}

export class ExpandedGroupTask {
  groupTask: GroupTask;
  workflow: TaskWorkflow;
}

export class Workflow {
  workflowID: string;
  boardID: string;
  name: string;

  active: boolean;

  source: Container;
  destinations: Container[];
}

export class DistributionWorkflow extends Workflow {
  postsPerDestination: number;
}

export class TaskWorkflow extends Workflow {
  prompt: string;

  requiredActions: TaskAction[];
  assignedGroups: string[];
}

const workflows = {
  DistributionWorkflow,
};

export default workflows;
