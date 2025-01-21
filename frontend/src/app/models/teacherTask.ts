// src/app/models/teacher-task.ts

export interface TeacherTask {
    taskID: string;
    name: string;
    activityID: string;
    order: number;
    type: string;
    workflowID?: string; // Optional
    aiAgentID?: string; // Optional
    customPrompt?: string; // Optional
    // ... add more properties for different task types as needed ...
    createdAt?: string;
    updatedAt?: string; 
  }