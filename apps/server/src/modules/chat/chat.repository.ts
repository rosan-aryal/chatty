import { eq, and, desc, lt } from "drizzle-orm";
import { message } from "@chat-application/db/schema/chat";
import type { db as DB } from "@chat-application/db";

type Database = typeof DB;

export class ChatRepository {
  constructor(private db: Database) {}

  async createMessage(data: {
    content: string;
    senderId: string;
    groupId?: string;
    friendshipId?: string;
  }) {
    const id = Bun.randomUUIDv7();
    return this.db
      .insert(message)
      .values({ id, ...data })
      .returning();
  }

  async getGroupMessages(groupId: string, limit = 50, before?: string) {
    return this.db.query.message.findMany({
      where: before
        ? and(eq(message.groupId, groupId), lt(message.id, before))
        : eq(message.groupId, groupId),
      orderBy: [desc(message.createdAt)],
      limit,
      with: { sender: true },
    });
  }

  async getFriendMessages(friendshipId: string, limit = 50, before?: string) {
    return this.db.query.message.findMany({
      where: before
        ? and(eq(message.friendshipId, friendshipId), lt(message.id, before))
        : eq(message.friendshipId, friendshipId),
      orderBy: [desc(message.createdAt)],
      limit,
      with: { sender: true },
    });
  }
}
