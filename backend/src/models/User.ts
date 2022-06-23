import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';

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
}

export default getModelForClass(UserModel);
