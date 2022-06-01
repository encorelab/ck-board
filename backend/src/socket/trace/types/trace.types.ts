import { SocketPayload } from "../../events/types/event.types";

export interface TraceInput<T> {
  eventType: string;
  socketPayload: SocketPayload<T>;
}
