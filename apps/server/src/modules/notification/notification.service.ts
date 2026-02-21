import type { NotificationRepository } from "./notification.repository";

export class NotificationService {
  constructor(private notificationRepo: NotificationRepository) {}

  async create(data: {
    userId: string;
    type: "friend_request" | "friend_accepted" | "group_invite";
    data: Record<string, unknown>;
  }) {
    return this.notificationRepo.create(data);
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
