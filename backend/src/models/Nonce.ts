import {
  prop,
  modelOptions,
  getModelForClass,
  index,
} from '@typegoose/typegoose';

@modelOptions({
  schemaOptions: {
    collection: 'nonces',
    timestamps: true,
  },
})
@index({ createdAt: 1 }, { expireAfterSeconds: 60 })
export class NonceModel {
  @prop({ required: true })
  public value!: string;
}

export default getModelForClass(NonceModel);
