export enum ContainerType {
  BOARD = 'BOARD',
  BUCKET = 'BUCKET',
}

export enum DistributionWorkflowType {
  RANDOM = 'RANDOM',
  TAG = 'TAG',
  UPVOTES = 'UPVOTES',
}

export class Container {
  type: ContainerType;
  id: string;
  name: string;
}

export class DistributionWorkflowTypeModel {
  type: DistributionWorkflowType;
  data: any;
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
  // postsPerDestination: number;
  distributionWorkflowType: DistributionWorkflowTypeModel;
  removeFromSource: boolean;
}

const workflows = {
  DistributionWorkflow,
};

export default workflows;
