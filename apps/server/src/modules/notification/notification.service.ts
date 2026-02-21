import type { NotificationRepository } from "./notification.repository";
import { connectionManager } from "../../ws/connection-manager";

export class NotificationService {
  constructor(private notificationRepo: NotificationRepository) {}

  async create(data: {
    userId: string;
    type: "friend_request" | "friend_accepted" | "group_invite";
    data: Record<string, unknown>;
  }) {
    const [created] = await this.notificationRepo.create(data);
    // Push real-time notification via WebSocket
    connectionManager.sendTo(data.userId, {
      type: "notification:new",
      data: created,
    });
    return [created];
  }

  async list(userId: string) {
    return this.notificationRepo.listByUser(userId);
  }

  async countUnread(userId: string) {
    return this.notificationRepo.countUnread(userId);
  }

  async markAsRead(id: string, userId: string) {
    return this.notificationRepo.markAsRead(id, userId);
  }

  async markAllAsRead(userId: string) {
    return this.notificationRepo.markAllAsRead(userId);
  }
}
