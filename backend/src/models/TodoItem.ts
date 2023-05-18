import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';

export enum TodoItemType {
  COGNITION = 'COGNITION',
  SEL = 'SEL',
  BEHAVIOURAL = 'BEHAVIOURAL',
  ATL = 'ATL',
  CLASS = 'CLASS',
}

export enum CompletionQuality {
  N_A = 'N_A',
  INCOMPLETE = 'INCOMPLETE',
  VERY_UNSATISFIED = 'VERY_UNSATISFIED',
  UNSATISFIED = 'UNSATISFIED',
  NEUTRAL = 'NEUTRAL',
  SATISFIED = 'SATISFIED',
  VERY_SATISFIED = 'VERY_SATISFIED',
}

export class Deadline {
  @prop({ required: true })
  public date!: string;

  @prop({ required: true })
  public time!: string;
}

@modelOptions({ schemaOptions: { collection: 'todoItems', timestamps: true } })
export class TodoItemModel {
  @prop({ required: true })
  public todoItemID!: string;

  @prop({ required: true })
  public projectID!: string;

  @prop({ required: true })
  public userID!: string;

  @prop({ required: true })
  public title!: string;

  @prop({ required: false })
  public description?: string;

  @prop({ required: false })
  public groupID!: string;

  @prop({ required: true, type: String, enum: TodoItemType })
  public type!: TodoItemType[];

  @prop({ required: true })
  public completed!: boolean;

  @prop({ required: false, type: String, enum: CompletionQuality })
  public quality?: string;

  @prop({ required: true, type: () => [Deadline] })
  public deadline!: Deadline;

  @prop({ required: true })
  public notifications!: string[];

  @prop({ required: true })
  public overdue!: boolean;
}

export default getModelForClass(TodoItemModel);
