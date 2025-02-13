// src/models/AiAgent.ts
import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { collection: 'aiagents', timestamps: true } })
export class AiAgentModel {
  @prop({ required: true })
  public aiAgentID!: string;

  @prop({ required: true })
  public activityID!: string; 

  @prop({ required: true })
  public name!: string;

  @prop({ required: true })
  public type!: string; // "teacher", "idea_chat", "idea_ambient", "personal_learning", "group_interaction", "workflow"

  @prop()
  public persona?: string;  // Optional, use ?

  @prop()
  public agentType?: string; // "chat" or "ambient"

  @prop()
  public trigger?: string; // "chat", "manual", "subscription", "event"

  @prop({ type: () => [String] }) // Array of strings
  public triggerEventTypes?: string[];

  @prop()
  public eventThreshold?: number;

  @prop()
  public aiPublishChannel?: string;

  @prop()
  public aiSubscriptionChannel?: string;

  @prop({ type: () => [String] }) // Array of strings
  public payloadScope?: string[];

  @prop()
  public userScope?: string;

  @prop()
  public task?: string;

  @prop()
  public databaseWriteAccess?: boolean;

  @prop({ type: () => [String] }) // Array of strings
  public uiIntegrations?: string[];

  @prop()
  public enabled?: boolean;

  @prop()
  public topic?: string;

  @prop()
  public criteriaToGroupStudents?: string;

  @prop({ type: () => [String] }) // Array of strings.
  public workflowsToActivate?: string[];

  @prop()
  public criteriaToActivateWorkflow?: string;

  @prop({ required: true, default: 0 }) //for ordering
  public order!: number;
}

const AiAgent = getModelForClass(AiAgentModel);
export default AiAgent;