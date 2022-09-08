import { ClientError } from './base.errors';

export class BadRequestError extends ClientError {
  constructor(message: string) {
    super(message);
  }

  get statusCode() {
    return 400;
  }
}

export class UnauthorizedError extends ClientError {
  constructor(message: string) {
    super(message);
  }

  get statusCode() {
    return 401;
  }
}

export class ForbiddenError extends ClientError {
  constructor(message: string) {
    super(message);
  }

  get statusCode() {
    return 403;
  }
}

export class NotFoundError extends ClientError {
  constructor(message: string) {
    super(message);
  }

  get statusCode() {
    return 404;
  }
}

export default {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
};
