// src/app/models/ai-agent.ts

// Interface for configuration data (used in getConfig) is no longer used.

// Base class for all AI Agents (Simplified)
export abstract class AiAgent {
    aiAgentID: string;
    activityID: string;
    name: string;
    type: string;
    persona: string | null = null;
    agentType: string | null = null;
    trigger: string | null = null;
    triggerEventTypes?: string[] | null = null;
    eventThreshold?: number | null = null;
    aiPublishChannel: string | null = null;
    aiSubscriptionChannel: string | null = null;
    payloadScope: string[] | null = null;
    userScope: string | null = null;
    task: string | null = null;
    databaseWriteAccess: boolean | null = null;
    uiIntegrations: string[] | null = null;
    enabled: boolean | null = null;
    topic: string | null = null;
    criteriaToGroupStudents?: string | null = null;
    workflowsToActivate?: string[] | null = null;
    criteriaToActivateWorkflow?: string | null = null;
    order: number = 0;

    constructor(data: Partial<AiAgent>) {
        Object.assign(this, data);
    }
}

// --- Teacher Agent ---
export class TeacherAgent extends AiAgent {  // <--- EXPORT added
    constructor(data: Partial<TeacherAgent> = {}) {
        super({
            ...data,
            type: 'teacher',
            name: 'Teacher Agent',
            agentType: 'chat',
            trigger: 'chat',
            userScope: 'all',
            persona: "You are a helpful teaching assistant...",
            task: "Guide classroom discussion.",
            payloadScope: data.payloadScope ?? ['all'],
            enabled: data.enabled ?? true,
            // No need to set undefined properties:
            // databaseWriteAccess: data.databaseWriteAccess ?? undefined,
            // uiIntegrations: data.uiIntegrations ?? undefined,
        });
    }
}

// --- Idea Agent (Chat) ---
export class IdeaAgentChat extends AiAgent { // <--- EXPORT added
    constructor(data: Partial<IdeaAgentChat> = {}) {
        super({
            ...data,
            type: 'idea_chat',
            name: 'Idea Agent (Chat)',
            agentType: 'chat',
            trigger: 'chat',
            userScope: 'all',
            persona: "You are an idea generation assistant...",
            task: "Generate diverse ideas related to the topic.",
            databaseWriteAccess: false,
            uiIntegrations: [], // Correctly initialize to empty array
            payloadScope: data.payloadScope ?? ['all'],
            enabled: data.enabled ?? true,
        });
    }
}

// --- Idea Agent (Ambient) ---
export class IdeaAgentAmbient extends AiAgent { // <--- EXPORT added
    constructor(data: Partial<IdeaAgentAmbient> = {}) {
        super({
            ...data,
            type: 'idea_ambient',
            name: 'Idea Agent (Ambient)',
            agentType: 'ambient',
            trigger: 'event',
            userScope: 'all',
            persona: "You are an idea generation assistant that monitors student activity...",
            task: "Generate ideas based on student posts and comments.",
            databaseWriteAccess: false,
            uiIntegrations: [], // Correctly initialize
            payloadScope: data.payloadScope ?? ['all'],
            enabled: data.enabled ?? true,
        });
    }
}
// --- Personal Learning Agent ---
export class PersonalLearningAgent extends AiAgent { // <--- EXPORT added
    constructor(data: Partial<PersonalLearningAgent> = {}) {
      super({ ...data, type: 'personal_learning', name: 'Personal Learning Agent' });
      this.agentType = 'chat';
      this.trigger = 'chat';
      if (this.enabled === undefined || this.enabled === null) {
        this.enabled = true; //default to true
    }
    }
  }

  // --- Group Interaction Agent ---
  export class GroupInteractionAgent extends AiAgent { // <--- EXPORT added
    constructor(data: Partial<GroupInteractionAgent> = {}) {
        super({...data, type: 'group_interaction', name: 'Group Interaction Agent'});
        this.agentType = 'ambient';
        this.trigger = 'event';
        this.userScope = 'group';
        this.persona = "You are a group interaction monitor..."; // Fixed persona
        if (this.enabled === undefined || this.enabled === null) {
            this.enabled = true; //default to true
        }
    }
}

// --- Workflow Agent ---
export class WorkflowAgent extends AiAgent { // <--- EXPORT added
    constructor(data: Partial<WorkflowAgent> = {}) {
        super({...data, type: 'workflow', name: 'Workflow Agent'});
        this.agentType = 'ambient';
        this.trigger = 'manual';
        this.userScope = 'all';
        this.persona = "You are a workflow automation agent..."; // Fixed persona
        this.task = "group students"; // Fixed task for now
        if (this.enabled === undefined || this.enabled === null) {
            this.enabled = true; //default to true
        }
    }
}