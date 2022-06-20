import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { collection: 'trace', timestamps: true } })
export class TraceModel {
  @prop({ required: true })
  projectID!: string;

  @prop({ required: true })
  projectName!: string;

  @prop({ required: true })
  boardID!: string;

  @prop({ required: true })
  boardName!: string;

  @prop({ required: true })
  agentUserID!: string;

  @prop({ required: true })
  agentUserName!: string;

  @prop({ required: true })
  clientTimestamp!: Date;

  @prop({ required: true })
  eventType!: string;

  @prop({ required: true })
  event!: any;
}

export default getModelForClass(TraceModel);
