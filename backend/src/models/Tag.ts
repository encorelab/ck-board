import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { collection: 'tags' } })
export class TagModel {
  @prop({ required: false })
  public boardID!: string;

  @prop({ required: true })
  public name!: string;

  @prop({ required: true })
  public color!: string;
}

export default getModelForClass(TagModel);