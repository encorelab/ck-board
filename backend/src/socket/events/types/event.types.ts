export interface TraceContext {
  projectID: string;
  boardID: string;
  userID: string;
}
export interface SocketPayload<T> {
  trace: TraceContext;
  eventData: T;
}
