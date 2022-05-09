import CKEvent from "./ckEvent"

export default class Trace {
    traceID: string = "";
    projectID : string = "";
    projectName: string = "";
    boardID: string = "";
    boardName: string = "";
    agentUserID:string = "";
    agentUserName: string = "";
    clientTimestamp: number = -1;
    serverTimestamp: number = -1;
    eventType: string ="";
    event:CKEvent
}