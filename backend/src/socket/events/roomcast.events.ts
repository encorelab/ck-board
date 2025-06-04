import { Server, Socket } from 'socket.io';
import { SocketEvent } from '../../constants'; // Your SocketEvent enum
import { SocketPayload } from '../types/event.types'; // Assumed path and structure
import { ResourceClass as Resource } // Assuming ResourceClass is the exported class from your Resource model
from '../../models/Resource'; // Adjust path as necessary

// Payload expected from the authoring tool for RESOURCES_UPDATE
// and also the structure of 'result' passed to handleResult.
interface ResourcesUpdateEventPayload {
  projectID: string;
  activityID: string;
  boardID: string;
  resources: Resource[]; // Use the specific Resource type/class
}

// This is the structure the client (roomcasting environment) expects to receive.
// It's often the same as what the authoring tool sends, wrapped in eventData.
interface ClientResourcesUpdateData {
  eventData: ResourcesUpdateEventPayload;
}


class RoomcastUpdate {
  static type: SocketEvent = SocketEvent.RESOURCES_UPDATE;

  /**
   * Handles the incoming data from the client (authoring tool).
   * Validates and processes the data.
   * @param data The payload received from the socket event.
   * @returns The processed (and potentially validated) event data.
   */
  static async handleEvent(data: SocketPayload<ResourcesUpdateEventPayload>): Promise<ResourcesUpdateEventPayload> {
    // Ensure data and data.eventData exist
    if (!data || !data.eventData) {
      console.error("RoomcastUpdate: Invalid or missing eventData in payload.");
      throw new Error("Invalid payload: eventData is missing.");
    }

    const { projectID, activityID, boardID, resources } = data.eventData;

    // Basic validation
    if (!projectID || !activityID || !boardID) {
      const missingFields = [];
      if (!projectID) missingFields.push('projectID');
      if (!activityID) missingFields.push('activityID');
      if (!boardID) missingFields.push('boardID');
      const errorMessage = `RoomcastUpdate: Missing critical IDs in event data. Missing: ${missingFields.join(', ')}`;
      console.error(errorMessage);
      throw new Error(`Invalid payload for ${SocketEvent.RESOURCES_UPDATE}: ${errorMessage}`);
    }

    if (!Array.isArray(resources)) {
      const errorMessage = `RoomcastUpdate: 'resources' field must be an array.`;
      console.error(errorMessage);
      throw new Error(`Invalid payload for ${SocketEvent.RESOURCES_UPDATE}: ${errorMessage}`);
    }

    console.log(`RoomcastUpdate handleEvent - Received valid data for project ${projectID}, activity ${activityID}`);
    // You could add more processing here if needed, e.g., fetching related data,
    // but for now, we're just passing it through to be broadcasted.
    return data.eventData; // Pass the full, validated eventData through
  }

  /**
   * Handles the result from handleEvent and broadcasts it to the appropriate clients.
   * @param io The Socket.IO server instance.
   * @param socket The socket instance of the sender (can be used to exclude sender if needed).
   * @param result The processed data from handleEvent (which is ResourcesUpdateEventPayload).
   */
  static async handleResult(io: Server, socket: Socket, result: ResourcesUpdateEventPayload): Promise<void> {
    const { projectID, activityID, boardID, resources } = result;

    // Define the room to broadcast to. This should match how clients join rooms.
    // Example: if clients join a room named after the projectID.
    const roomToBroadcastTo = projectID;
    // Or, if your room naming convention is different, e.g., `projectRoom:${projectID}`:
    // const roomToBroadcastTo = `projectRoom:${projectID}`;

    // Construct the payload exactly as the client (roomcasting environment) expects it.
    // The roomcasting client's socket listener expects the data to be wrapped in an 'eventData' object.
    const payloadForClients: ClientResourcesUpdateData = {
      eventData: {
        projectID,
        activityID,
        boardID,
        resources,
      }
    };

    console.log(`RoomcastUpdate handleResult: Broadcasting ${SocketEvent.RESOURCES_UPDATE} to room "${roomToBroadcastTo}"`);
    // console.log(`Payload being broadcasted:`, JSON.stringify(payloadForClients, null, 2));


    // Broadcast to all clients in the specific project room.
    // If you want to exclude the sender: socket.to(roomToBroadcastTo).emit(...)
    io.to(roomToBroadcastTo).emit(SocketEvent.RESOURCES_UPDATE, payloadForClients);
  }
}

// Array of event handler classes
const roomcastEvents = [RoomcastUpdate];

export default roomcastEvents;
