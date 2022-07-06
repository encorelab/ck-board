import { prop, modelOptions, getModelForClass } from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { collection: 'nonces', timestamps: true } })
export class NonceModel {
  @prop({ required: true })
  public value!: string;

  @prop({ required: true })
  public expiration!: Date;
}

export default getModelForClass(NonceModel);
