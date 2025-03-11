import { SocketEvent } from '../../constants';
import { GroupModel } from '../../models/Group';
import { SocketPayload } from '../types/event.types';
import { Server, Socket } from 'socket.io';

class GroupChange {
  static type: SocketEvent = SocketEvent.GROUP_CHANGE;

  static async handleEvent(
    input: SocketPayload<GroupModel>
  ): Promise<GroupModel | null> {
    return input.eventData;
  }

  static async handleResult(
    io: Server,
    socket: Socket,
    result: GroupModel | null
  ) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

class GroupDelete {
  static type: SocketEvent = SocketEvent.GROUP_DELETE;

  static async handleEvent(
    input: SocketPayload<GroupModel>
  ): Promise<GroupModel | null> {
    return input.eventData;
  }

  static async handleResult(
    io: Server,
    socket: Socket,
    result: GroupModel | null
  ) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

const groupEvents = [GroupChange, GroupDelete];

export default groupEvents;
