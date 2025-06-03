import { Server, Socket } from 'socket.io';
import { SocketEvent } from '../../constants';
import { sendMessage } from '../../services/vertexAI'; // Import the unified function
import { SocketPayload } from '../types/event.types'; // Import the type for SocketPayload

// Define a type for the AI message data
interface AiMessageData {
  posts: any[]; // Or a more specific type for your posts
  currentPrompt: string;
  fullPromptHistory: string;
  boardId: string;
  userId: string;
  type: 'teacher_agent' | 'idea_agent'; // Add the type field
}

class AiMessage {
  static type: SocketEvent = SocketEvent.AI_MESSAGE;

  static async handleEvent(data: SocketPayload<AiMessageData>): Promise<{
    posts: any[];
    currentPrompt: string;
    fullPromptHistory: string;
    boardId: string;
    userId: string;
    type: 'teacher_agent' | 'idea_agent';
  }> {
    const {
      posts,
      currentPrompt,
      fullPromptHistory: fullPromptHistory,
      boardId,
      userId,
      type,
    } = data.eventData;

    console.log('AI_MESSAGE received:', { boardId, userId });

    // ... any necessary data processing or validation ...
    return {
      posts,
      currentPrompt,
      fullPromptHistory: fullPromptHistory,
      boardId,
      userId,
      type,
    };
  }

  static async handleResult(
    io: Server,
    socket: Socket,
    result: {
      posts: any[];
      currentPrompt: string;
      fullPromptHistory: string;
      boardId: string;
      userId: string;
      type: 'teacher_agent' | 'idea_agent';
    }
  ): Promise<void> {
    const { posts, currentPrompt, fullPromptHistory, boardId, userId, type } =
      result;
    socket.data.boardId = boardId;
    socket.data.userId = userId;
    sendMessage(posts, currentPrompt, fullPromptHistory, socket, type);
  }
}

const aiEvents = [AiMessage];

export default aiEvents;
