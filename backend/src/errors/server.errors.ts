import { ServerError } from './base.errors';

export class InternalServerError extends ServerError {
  constructor(message: string) {
    super(message);
  }

  get statusCode() {
    return 500;
  }
}

export default {
  InternalServerError,
};
