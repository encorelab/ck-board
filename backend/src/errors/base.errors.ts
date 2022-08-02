export class ApplicationError extends Error {
  get name() {
    return this.constructor.name;
}
}

export class ClientError extends Error {}

export class ServerError extends Error {}

export default {
  ApplicationError,
  ClientError,
  ServerError,
};