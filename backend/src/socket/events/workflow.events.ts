import { Server, Socket } from "socket.io";
import { run } from "../../agents/workflow.agent";
import { SocketEvent } from "../../constants";
import { WorkflowModel } from "../../models/Workflow";
import dalWorkflow from "../../repository/dalWorkflow";

class WorkflowRun {
  static type: SocketEvent = SocketEvent.WORKFLOW_RUN;

  static async handleEvent(
    eventData: WorkflowModel
  ): Promise<WorkflowModel | null> {
    const id = eventData.workflowID;

    const workflow = await dalWorkflow.update(id, {
      active: true,
    });

    if (!workflow) return null;

    await run(workflow);
    return workflow;
  }

  static async handleResult(
    io: Server,
    socket: Socket,
    result: WorkflowModel | null
  ) {
    socket.to(socket.data.room).emit(this.type, result);
  }
}

const workflowEvents = [WorkflowRun];

export default workflowEvents;
