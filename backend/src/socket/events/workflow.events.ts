import { Server, Socket } from 'socket.io';
import { run, runDistributionWorkflow } from '../../agents/workflow.agent';
import { SocketEvent } from '../../constants';
import { DistributionWorkflowModel, WorkflowType } from '../../models/Workflow';
import dalWorkflow from '../../repository/dalWorkflow';
import { SocketPayload } from '../types/event.types';

class WorkflowRunDistribution {
  static type: SocketEvent = SocketEvent.WORKFLOW_RUN_DISTRIBUTION;

  static async handleEvent(
    input: SocketPayload<DistributionWorkflowModel>
  ): Promise<DistributionWorkflowModel | null> {
    const id = input.eventData.workflowID;

    const workflow = await dalWorkflow.update(WorkflowType.DISTRIBUTION, id, {
      active: true,
    });

    if (!workflow) return null;

    await runDistributionWorkflow(workflow);
    return workflow;
  }

  static async handleResult(
    io: Server,
    socket: Socket,
    result: DistributionWorkflowModel | null
  ) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

const workflowEvents = [WorkflowRunDistribution];

export default workflowEvents;
