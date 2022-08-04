export enum ContainerType {
  BOARD = 'BOARD',
  BUCKET = 'BUCKET',
}

export class Container {
  type: ContainerType;
  id: string;
  name: string;
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

const workflows = {
  DistributionWorkflow,
};

export default workflows;
