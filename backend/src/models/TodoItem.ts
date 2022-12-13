import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import { GroupModel } from './Group';

export enum TodoItemType {
  COGNITION = 'COGNITION',
  SEL = 'SEL',
  BEHAVIOURAL = 'BEHAVIOURAL',
  CLASS = 'CLASS',
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
  public groupID!: string;

  @prop({ required: true, type: String, enum: TodoItemType })
  type!: TodoItemType[];

  @prop({ required: true })
  public completed!: boolean;

  @prop({ required: true, type: () => [Deadline] })
  public deadline!: Deadline;

  @prop({ required: true })
  public notifications!: string[];

  @prop({ required: true })
  public overdue!: boolean;
}

export default getModelForClass(TodoItemModel);
