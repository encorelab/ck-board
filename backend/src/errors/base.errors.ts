export class ApplicationError extends Error {
  get name() {
    return this.constructor.name;
  }

  get statusCode() {
    return -1;
  }
}

export class ClientError extends ApplicationError {}

export class ServerError extends ApplicationError {}

export default {
  ApplicationError,
  ClientError,
  ServerError,
};
