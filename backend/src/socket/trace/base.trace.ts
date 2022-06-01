import { TraceModel } from "../../models/trace";
import dalBoard from "../../repository/dalBoard";
import dalProject from "../../repository/dalProject";
import dalUser from "../../repository/dalUser";
import { TraceContext } from "../events/types/event.types";

export const createTrace = async (
  traceContext: TraceContext
): Promise<TraceModel> => {
  console.log(traceContext);
  const board = await dalBoard.getById(traceContext.boardID);
  const project = await dalProject.getById(traceContext.projectID);
  const user = await dalUser.findByUserID(traceContext.userID);
  if (
    project?.projectID === undefined ||
    user?.userID === undefined ||
    board?.boardID === undefined
  ) {
    throw new Error("Invalid board project or user in Trace Context");
  } else {
    const trace: TraceModel = {
      projectID: project?.projectID,
      projectName: project.name,
      boardID: board.boardID,
      boardName: board.name,
      agentUserID: user.userID,
      agentUserName: user.username,
      clientTimestamp: traceContext.clientTimestamp,
      eventType: "",
      event: {},
    };
    return trace;
  }
};
