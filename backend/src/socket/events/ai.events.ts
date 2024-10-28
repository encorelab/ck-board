import { Server, Socket } from 'socket.io';
import { SocketEvent } from '../../constants';
import { sendMessage } from '../../services/vertexAI';
import { SocketPayload } from '../types/event.types'; // Import the type for SocketPayload

// Define a type for the AI message data
interface AiMessageData {
  posts: any[]; // Or a more specific type for your posts
  prompt: string;
  boardId: string;
  userId: string;
}

class AiMessage {
  static type: SocketEvent = SocketEvent.AI_MESSAGE;

  static async handleEvent(
    data: SocketPayload<AiMessageData>
  ): Promise<{ posts: any[]; prompt: string; boardId: string; userId: string }> {
    const { posts, prompt, boardId, userId } = data.eventData;
    // ... any necessary data processing or validation ...
    return { posts, prompt, boardId, userId };
  }

  static async handleResult(
    io: Server,
    socket: Socket,
    result: { posts: any[]; prompt: string; boardId: string; userId: string }
  ): Promise<void> {
    const { posts, prompt, boardId, userId } = result;
    socket.data.boardId = boardId;
    socket.data.userId = userId;
    sendMessage(posts, prompt, socket);
  }
}

const aiEvents = [AiMessage];

export default aiEvents;
