import { Server, Socket } from 'socket.io';
import { SocketEvent } from '../../constants';
import {
  DistributionWorkflowModel,
  TaskWorkflowModel,
} from '../../models/Workflow';
import { SocketPayload } from '../types/event.types';

class WorkflowRunDistribution {
  static type: SocketEvent = SocketEvent.WORKFLOW_RUN_DISTRIBUTION;

  static async handleEvent(
    input: SocketPayload<DistributionWorkflowModel>
  ): Promise<DistributionWorkflowModel | null> {
    return input.eventData;
  }

  static async handleResult(
    io: Server,
    socket: Socket,
    result: DistributionWorkflowModel | null
  ) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

class WorkflowRunTask {
  static type: SocketEvent = SocketEvent.WORKFLOW_RUN_TASK;

  static async handleEvent(
    input: SocketPayload<TaskWorkflowModel>
  ): Promise<TaskWorkflowModel | null> {
    return input.eventData;
  }

  static async handleResult(
    io: Server,
    socket: Socket,
    result: TaskWorkflowModel | null
  ) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

const workflowEvents = [WorkflowRunDistribution, WorkflowRunTask];

export default workflowEvents;
