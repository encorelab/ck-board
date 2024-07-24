import { Group } from './group';

export enum ContainerType {
  BOARD = 'BOARD',
  BUCKET = 'BUCKET',
  WORKFLOW = 'WORKFLOW',
}

export enum DistributionWorkflowType {
  RANDOM = 'RANDOM',
  TAG = 'TAG',
  UPVOTES = 'UPVOTES',
}

export class DistributionWorkflowTypeModel {
  type: DistributionWorkflowType;
  data: any;
}

export class Container {
  type: ContainerType;
  id: string;
  name: string;
}

export enum WorkflowType {
  DISTRIBUTION = 'DISTRIBUTION',
  TASK = 'TASK',
  GENERATION = 'GENERATION',
  AI_CLASSIFICATION = 'AI_CLASSIFICATION',
}

export enum TaskWorkflowType {
  PEER_REVIEW = 'PEER_REVIEW',
  GENERATION = 'GENERATION',
}

export enum TaskActionType {
  COMMENT = 'COMMENT',
  TAG = 'TAG',
  CREATE_POST = 'CREATE_POST',
  CREATE_CATEGORIES = 'CREATE_CATEGORIES',
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
  group: Group;
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
  distributionWorkflowType: DistributionWorkflowTypeModel;
  removeFromSource: boolean;
}

export class TaskWorkflow extends Workflow {
  prompt: string;
  requiredActions: TaskAction[];
  assignedGroups: string[];
  type?: TaskWorkflowType;
}

export class AIClassificationWorkflow extends Workflow {
  numCategoryGeneration: number;
  removeFromSource: boolean;
}

const workflows = {
  DistributionWorkflow,
};

export default workflows;
