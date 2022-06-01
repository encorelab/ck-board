export interface TraceContext {
  projectID: string;
  boardID: string;
  userID: string;
  clientTimestamp: number;
}
export interface SocketPayload<T> {
  trace: TraceContext;
  eventData: T;
}
