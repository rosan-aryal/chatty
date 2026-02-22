import type { ServerWebSocket } from "bun";

export interface WsUserData {
  userId: string;
  gender?: string;
  country?: string;
  isPremium: boolean;
}

class ConnectionManager {
  private connections = new Map<string, ServerWebSocket<WsUserData>>();

  add(userId: string, ws: ServerWebSocket<WsUserData>) {
    this.connections.set(userId, ws);
  }

  remove(userId: string) {
    this.connections.delete(userId);
  }

  get(userId: string) {
    return this.connections.get(userId);
  }

  isOnline(userId: string) {
    return this.connections.has(userId);
  }

  sendTo(userId: string, message: object) {
    const ws = this.connections.get(userId);
    if (ws) ws.send(JSON.stringify(message));
  }

  broadcast(userIds: string[], message: object) {
    const json = JSON.stringify(message);
    for (const userId of userIds) {
      const ws = this.connections.get(userId);
      if (ws) ws.send(json);
    }
  }
}

export const connectionManager = new ConnectionManager();
