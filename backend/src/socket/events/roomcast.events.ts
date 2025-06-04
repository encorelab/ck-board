import { Server, Socket } from 'socket.io';
import { SocketEvent } from '../../constants'; // Your SocketEvent enum
import { SocketPayload } from '../types/event.types'; // Assumed path and structure
import { ResourceClass as Resource } // Assuming ResourceClass is the exported class from your Resource model
from '../../models/Resource'; // Adjust path as necessary

// Payload expected from the authoring tool for RESOURCES_UPDATE
interface ResourcesUpdateEventPayload {
  projectID: string;
  activityID: string;
  boardID: string;
  resources: Resource[]; // Use the specific Resource type/class
}

// Payload expected from the authoring tool for ACTIVITY_STOPPED
interface ActivityStoppedEventPayload {
  projectID: string;
  activityID: string; // The ID of the activity that was stopped
}

// This is the structure the client (roomcasting environment) expects to receive for RESOURCES_UPDATE.
interface ClientResourcesUpdateData {
  eventData: ResourcesUpdateEventPayload;
}

// This is the structure the client (roomcasting environment) expects to receive for ACTIVITY_STOPPED.
interface ClientActivityStoppedData {
  eventData: ActivityStoppedEventPayload;
}


class RoomcastUpdate {
  static type: SocketEvent = SocketEvent.RESOURCES_UPDATE;

  static async handleEvent(data: any): Promise<ResourcesUpdateEventPayload> {
    const actualEventPayload = data.eventData;

    if (!actualEventPayload) {
      console.error("RoomcastUpdate.handleEvent: Actual event payload (expected in data.eventData) is missing or malformed. Received data:", JSON.stringify(data, null, 2));
      throw new Error("Invalid payload: actual event payload for RESOURCES_UPDATE is missing.");
    }

    const { projectID, activityID, boardID, resources } = actualEventPayload;

    if (!projectID || !activityID || !boardID) {
      const missingFields = [];
      if (!projectID) missingFields.push('projectID');
      if (!activityID) missingFields.push('activityID');
      if (!boardID) missingFields.push('boardID');
      const errorMessage = `RoomcastUpdate.handleEvent: Missing critical IDs in actual event payload. Missing: ${missingFields.join(', ')}. Payload: ${JSON.stringify(actualEventPayload, null, 2)}`;
      console.error(errorMessage);
      throw new Error(`Invalid payload for ${SocketEvent.RESOURCES_UPDATE}: ${errorMessage}`);
    }

    if (!Array.isArray(resources)) {
      const errorMessage = `RoomcastUpdate.handleEvent: 'resources' field in actual event payload must be an array. Payload: ${JSON.stringify(actualEventPayload, null, 2)}`;
      console.error(errorMessage);
      throw new Error(`Invalid payload for ${SocketEvent.RESOURCES_UPDATE}: ${errorMessage}`);
    }

    console.log(`RoomcastUpdate.handleEvent - Received valid data for project ${projectID}, activity ${activityID}`);
    return actualEventPayload as ResourcesUpdateEventPayload; // Pass the correctly extracted payload
  }

  static async handleResult(io: Server, socket: Socket, result: ResourcesUpdateEventPayload): Promise<void> {
    const { projectID, activityID, boardID, resources } = result;
    const roomToBroadcastTo = projectID;
    const payloadForClients: ClientResourcesUpdateData = {
      eventData: { projectID, activityID, boardID, resources }
    };
    console.log(`RoomcastUpdate.handleResult: Broadcasting ${SocketEvent.RESOURCES_UPDATE} to room "${roomToBroadcastTo}"`);
    io.to(roomToBroadcastTo).emit(SocketEvent.RESOURCES_UPDATE, payloadForClients);
  }
}

// HANDLER FOR ACTIVITY_STOPPED (remains the same)
class ActivityStoppedUpdate {
  static type: SocketEvent = SocketEvent.ACTIVITY_STOPPED;

  static async handleEvent(data: any): Promise<ActivityStoppedEventPayload> {
    const actualEventPayload = data.eventData;

    if (!actualEventPayload) {
      console.error("ActivityStoppedUpdate.handleEvent: eventData is missing or malformed. Received data:", JSON.stringify(data, null, 2));
      throw new Error("Invalid payload: eventData for ACTIVITY_STOPPED is missing.");
    }

    const { projectID, activityID } = actualEventPayload;

    if (!projectID || !activityID) {
      const missingFields = [];
      if (!projectID) missingFields.push('projectID');
      if (!activityID) missingFields.push('activityID');
      const errorMessage = `ActivityStoppedUpdate.handleEvent: Missing critical IDs in event payload. Missing: ${missingFields.join(', ')}. Payload: ${JSON.stringify(actualEventPayload, null, 2)}`;
      console.error(errorMessage);
      throw new Error(`Invalid payload for ${SocketEvent.ACTIVITY_STOPPED}: ${errorMessage}`);
    }
    console.log(`ActivityStoppedUpdate.handleEvent - Received valid data for project ${projectID}, stopped activity ${activityID}`);
    return actualEventPayload as ActivityStoppedEventPayload;
  }

  static async handleResult(io: Server, socket: Socket, result: ActivityStoppedEventPayload): Promise<void> {
    const { projectID, activityID } = result;
    const roomToBroadcastTo = projectID;

    const payloadForClients: ClientActivityStoppedData = {
      eventData: {
        projectID,
        activityID,
      }
    };

    console.log(`ActivityStoppedUpdate.handleResult: Broadcasting ${SocketEvent.ACTIVITY_STOPPED} to room "${roomToBroadcastTo}"`);
    io.to(roomToBroadcastTo).emit(SocketEvent.ACTIVITY_STOPPED, payloadForClients);
  }
}


const roomcastEvents = [
    RoomcastUpdate,
    ActivityStoppedUpdate
];

export default roomcastEvents;
