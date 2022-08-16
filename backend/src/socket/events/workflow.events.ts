import { Server, Socket } from 'socket.io';
import { runWorkflow } from '../../agents/workflow.agent';
import { SocketEvent } from '../../constants';
import { DistributionWorkflowModel } from '../../models/Workflow';
import dalWorkflow from '../../repository/dalWorkflow';
import { SocketPayload } from '../types/event.types';

class WorkflowRunDistribution {
  static type: SocketEvent = SocketEvent.WORKFLOW_RUN_DISTRIBUTION;

  static async handleEvent(
    input: SocketPayload<DistributionWorkflowModel>
  ): Promise<string[] | null> {
    const id = input.eventData.workflowID;

    const workflow = await dalWorkflow.updateDistribution(id, {
      active: true,
    });

    if (!workflow) return null;
    const posts = await runWorkflow(workflow);
    if (posts) return posts;
    return null;
  }

  static async handleResult(
    io: Server,
    socket: Socket,
    result: string[] | null
  ) {
    io.to(socket.data.room).emit(this.type, result);
  }
}

const workflowEvents = [WorkflowRunDistribution];

export default workflowEvents;
