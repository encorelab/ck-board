class SocketManager {
  private static _instance: SocketManager;

  private _userToSocket: Map<string, string[]>;

  private constructor() {
    this._userToSocket = new Map();
  }

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  /**
   * Adds a socket ID to a user's list of socket IDs.
   * If the user does not exist, creates a new entry.
   */
  add(userID: string, socketID: string): void {
    const sockets = this._userToSocket.get(userID) || [];
    sockets.push(socketID);
    this._userToSocket.set(userID, sockets);
  }

  removeByUserId(userID: string): boolean {
    return this._userToSocket.delete(userID);
  }

  /**
   * Removes a specific socket ID from a user's list.
   * If the user has no more socket IDs left after removal, deletes the user's entry.
   */
  removeBySocketId(socketID: string): boolean {
    for (const [user, sockets] of this._userToSocket.entries()) {
      const index = sockets.indexOf(socketID);
      if (index !== -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          // If no sockets left, remove the user entry
          this._userToSocket.delete(user);
        } else {
          // Update with the modified array
          this._userToSocket.set(user, sockets);
        }
        return true;
      }
    }
    return false;
  }

  /**
   * Retrieves the list of socket IDs for a user.
   */
  get(userID: string): string[] | undefined {
    return this._userToSocket.get(userID);
  }
}

export default SocketManager;
