import {
  getModelForClass,
  modelOptions,
  prop,
  Severity,
} from '@typegoose/typegoose';

import { BoardType, ViewType } from './Board';

@modelOptions({
  schemaOptions: { collection: 'trace', timestamps: true },
  options: { allowMixed: Severity.ALLOW },
})
export class TraceModel {
  @prop({ required: true })
  projectID!: string;

  @prop({ required: true })
  projectName!: string;

  @prop({ required: true })
  boardID!: string;

  @prop({ required: true })
  boardName!: string;

  @prop({ enum: BoardType, type: String, required: true })
  boardType!: BoardType;

  @prop({ required: true })
  boardContext!: string;

  @prop({ required: false })
  viewType?: ViewType | undefined;

  @prop({ required: true })
  agentUserID!: string;

  @prop({ required: true })
  agentUserName!: string;

  @prop({ required: true })
  clientTimestamp!: Date;

  @prop({ required: true })
  eventType!: string;

  @prop({ required: true })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event!: any;
}

export default getModelForClass(TraceModel);
