import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';

@modelOptions({
  schemaOptions: { collection: 'chatMessages', timestamps: true },
})
export class ChatMessageModel {
  @prop({ required: true })
  public userId!: string;

  @prop({ required: true })
  public boardId!: string;

  @prop({ required: true, enum: ['user', 'assistant'] })
  public role!: string;

  @prop({ required: true })
  public content!: string;
}

const ChatMessage = getModelForClass(ChatMessageModel);
export default ChatMessage;
