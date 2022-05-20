export enum DestinationType {
  BOARD = 'BOARD',
  BUCKET = 'BUCKET',
}

export class Destination {
  type: DestinationType;
  id: string;
  name: string;
}

export class Workflow {
  workflowID: string;
  boardID: string;
  name: string;

  active: boolean;

  source: Destination;
  destinations: Destination[];

  postsPerDestination: number;
}

export default Workflow;
