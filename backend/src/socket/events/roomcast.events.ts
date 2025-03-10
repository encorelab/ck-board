// backend/src/socket/events/roomcast.events.ts
import { Server, Socket } from 'socket.io';
import { SocketEvent } from '../../constants';
import { SocketPayload } from '../types/event.types';

interface RoomcastData {
  projectID: string;
  resources: any[]; // Use a more specific type if possible
}
  

class RoomcastUpdate {
  static type: SocketEvent = SocketEvent.RESOURCES_UPDATE;

  static async handleEvent(data: SocketPayload<RoomcastData>): Promise<RoomcastData> {
    const { projectID, resources } = data.eventData;
    // Add any validation or processing of the data here, if needed.
    // For example, you could check if the projectID is valid.
    console.log("RoomcastUpdate handleEvent")
    return { projectID, resources };
  }

    static async handleResult(io: Server, socket: Socket, result: RoomcastData): Promise<void> {
      const { projectID, resources } = result;
      // Broadcast to all clients in the room (project) EXCEPT the sender
      //  socket.to(projectID).emit(SocketEvent.RESOURCES_UPDATE, resources);
      // Could also just emit to the room, including sender. Depends on your needs.
      console.log("Roomcast Update handleResult")
      io.emit(SocketEvent.RESOURCES_UPDATE, resources);
    }
}

const roomcastEvents = [RoomcastUpdate];

export default roomcastEvents;