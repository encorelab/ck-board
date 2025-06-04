export interface Activity {
  activityID: string;
  name: string;
  projectID: string;
  boardID: string;
  groupIDs: string[];
  order: number;
  isActive?: boolean;
}
