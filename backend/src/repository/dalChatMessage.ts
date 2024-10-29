import ChatMessage, { ChatMessageModel } from '../models/ChatMessage';

export const save = async (message: ChatMessageModel) => {
  try {
    const savedMessage = await ChatMessage.create(message);
    return savedMessage;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

export const getByBoardIdAndUserId = async (
  boardId: string,
  userId: string
) => {
  try {
    const messages = await ChatMessage.find({ boardId, userId }).sort({
      createdAt: 1,
    }); // Sort by createdAt in descending order (oldest to most recent)
    return messages;
  } catch (err) {
    throw new Error(JSON.stringify(err, null, ' '));
  }
};

const dalChatMessage = {
  save,
  getByBoardIdAndUserId,
};

export default dalChatMessage;
