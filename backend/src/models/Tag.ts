import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';

export class TagSpecialAttributes {
  @prop({ required: false })
  public borderWidth?: number;

  @prop({ required: false })
  public borderColor?: string;

  @prop({ required: false })
  public fillColor?: string;

  @prop({ required: false })
  public opacity?: number;
}

@modelOptions({ schemaOptions: { collection: 'tags' } })
export class TagModel {
  @prop({ required: false })
  public boardID!: string;

  @prop({ required: true })
  public name!: string;

  @prop({ required: true })
  public color!: string;

  @prop({ required: false, type: () => [TagSpecialAttributes] })
  public specialAttributes?: TagSpecialAttributes;
}

export default getModelForClass(TagModel);
