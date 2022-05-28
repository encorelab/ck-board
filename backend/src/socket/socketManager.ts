class SocketManager {
  private static _instance: SocketManager;

  private _userToSocket: Map<string, string>;

  private constructor() {
    this._userToSocket = new Map();
  }

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  add(userID: string, socketID: string): Map<string, string> {
    return this._userToSocket.set(userID, socketID);
  }

  removeByUserId(userID: string): boolean {
    return this._userToSocket.delete(userID);
  }

  removeBySocketId(socketID: string): boolean {
    for (const [user, socket] of this._userToSocket.entries()) {
      if (socket == socketID) {
        return this._userToSocket.delete(user);
      }
    }
    return false;
  }

  get(userID: string) {
    return this._userToSocket.get(userID);
  }
}

export default SocketManager;
