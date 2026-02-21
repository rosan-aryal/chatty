import { eq, and, desc } from "drizzle-orm";
import { notification } from "@chat-application/db/schema/chat";
import type { db as DB } from "@chat-application/db";

type Database = typeof DB;

export class NotificationRepository {
  constructor(private db: Database) {}

  async create(data: {
    userId: string;
    type: "friend_request" | "friend_accepted" | "group_invite";
    data: Record<string, unknown>;
  }) {
    const id = Bun.randomUUIDv7();
    return this.db
      .insert(notification)
      .values({ id, ...data })
      .returning();
  }

  async listByUser(userId: string, limit = 50) {
    return this.db.query.notification.findMany({
      where: eq(notification.userId, userId),
      orderBy: [desc(notification.createdAt)],
      limit,
    });
  }

  async countUnread(userId: string) {
    const result = await this.db.query.notification.findMany({
      where: and(
        eq(notification.userId, userId),
        eq(notification.read, false)
      ),
    });
    return result.length;
  }

  async markAsRead(id: string, userId: string) {
    return this.db
      .update(notification)
      .set({ read: true })
      .where(and(eq(notification.id, id), eq(notification.userId, userId)))
      .returning();
  }

  async markAllAsRead(userId: string) {
    return this.db
      .update(notification)
      .set({ read: true })
      .where(and(eq(notification.userId, userId), eq(notification.read, false)))
      .returning();
  }
}
