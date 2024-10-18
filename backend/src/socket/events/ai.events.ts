// ai.events.ts
import { Server, Socket } from 'socket.io';
import { SocketEvent } from '../../constants';
import { sendMessage } from '../../services/vertexAI';
import { SocketPayload } from '../types/event.types'; // Import the type for SocketPayload

// Define a type for the AI message data
interface AiMessageData {
  boardID: string;
  posts: any[]; // Or a more specific type for your posts
  prompt: string;
}

class AiMessage {
    static type: SocketEvent = SocketEvent.AI_MESSAGE;
  
    static async handleEvent(data: SocketPayload<AiMessageData>): Promise<{ posts: any[], prompt: string, boardID: string }> {
      const { boardID, posts, prompt } = data.eventData;
      // ... any necessary data processing or validation ...
      return { posts, prompt, boardID }; 
    }
  
    static async handleResult(io: Server, socket: Socket, result: { posts: any[], prompt: string, boardID: string }): Promise<void> {
      const { posts, prompt, boardID } = result; 
      console.log("socket sendMessage")
      sendMessage(posts, prompt, socket);
    }
  }

const aiEvents = [
  AiMessage,
];

export default aiEvents;