import { TraceContext } from './traceContext';

export class SocketPayload {
  trace: TraceContext;
  eventData: any;
}
