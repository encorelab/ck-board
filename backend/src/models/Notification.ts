import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';

@modelOptions({
  schemaOptions: { collection: 'notifications', timestamps: true },
})
export class NotificationModel {
  @prop({ required: true })
  public notificationID!: string;

  @prop({ required: true })
  public userID!: string;

  @prop({ required: true })
  public boardID!: string;

  @prop({ required: true })
  public postID!: string;

  @prop({ required: true })
  public text!: string;

  @prop({ required: true })
  public viewed!: boolean;
}

export default getModelForClass(NotificationModel);
