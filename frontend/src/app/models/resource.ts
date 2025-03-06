export interface Resource {
    resourceID: string;
    activityID: string;
    order: number;
    name: string;
    canvas: boolean; // Add the canvas property
    bucketView: boolean;
    workspace: boolean;
    monitor: boolean;
    ideaAgent: boolean;
    groupIDs: string[];
    // ... other properties as needed ...
  }