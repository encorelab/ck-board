class SocketManager {
  private static _instance: SocketManager;

  private _userToSocket: Map<string, string>;

  private constructor() {
    this._userToSocket = new Map();
  }

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  add(userID: string, socketID: string) {
    this._userToSocket.set(userID, socketID);
  }

  remove(userID: string) {
    this._userToSocket.delete(userID);
  }

  get(userID: string) {
    return this._userToSocket.get(userID);
  }
}

export default SocketManager;
