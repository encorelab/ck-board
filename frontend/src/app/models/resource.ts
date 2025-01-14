export interface Resource {
    resourceID: string;
    activityID: string;
    order: number;
    name: string;
    canvas: boolean; // Add the canvas property
    bucketView: boolean;
    workspace: boolean;
    monitor: boolean;
    // ... other properties as needed ...
  }