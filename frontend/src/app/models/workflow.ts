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

export enum TaskAction {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  TAG = 'TAG',
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

  actions: TaskAction[];
  assignedGroups: string[];
}

const workflows = {
  DistributionWorkflow,
};

export default workflows;
