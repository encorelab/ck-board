import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import { ViewType } from './Board';

export enum Role {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

@modelOptions({ schemaOptions: { collection: 'users', timestamps: true } })
export class UserModel {
  @prop({ required: true })
  public userID!: string;

  @prop({ required: true })
  public email!: string;

  @prop({ required: true })
  public password!: string;

  @prop({ required: true })
  public username!: string;

  @prop({ enum: Role, type: String, required: true })
  public role!: Role;

  @prop()
  public resetPasswordToken?: string;

  @prop()
  public resetPasswordExpires?: Date;

  @prop({ required: false })
  public currentView?: ViewType;

  @prop({ required: false })
  public apiKey?: string;

  @prop({ required: false })
  public apiKeyPrefix?: string;
}

export default getModelForClass(UserModel);
