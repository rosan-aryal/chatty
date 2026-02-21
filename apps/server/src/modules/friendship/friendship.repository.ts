import { eq, and, or } from "drizzle-orm";
import { friendship } from "@chat-application/db/schema/chat";
import type { db as DB } from "@chat-application/db";

type Database = typeof DB;

export class FriendshipRepository {
  constructor(private db: Database) {}

  async create(requesterId: string, addresseeId: string) {
    const id = Bun.randomUUIDv7();
    return this.db
      .insert(friendship)
      .values({ id, requesterId, addresseeId, status: "pending" })
      .returning();
  }

  async findById(id: string) {
    return this.db.query.friendship.findFirst({
      where: eq(friendship.id, id),
      with: { requester: true, addressee: true },
    });
  }

  async updateStatus(id: string, status: "accepted" | "rejected") {
    return this.db
      .update(friendship)
      .set({ status })
      .where(eq(friendship.id, id))
      .returning();
  }

  async findByUsers(userId1: string, userId2: string) {
    return this.db.query.friendship.findFirst({
      where: or(
        and(eq(friendship.requesterId, userId1), eq(friendship.addresseeId, userId2)),
        and(eq(friendship.requesterId, userId2), eq(friendship.addresseeId, userId1))
      ),
    });
  }

  async listFriends(userId: string) {
    return this.db.query.friendship.findMany({
      where: and(
        or(eq(friendship.requesterId, userId), eq(friendship.addresseeId, userId)),
        eq(friendship.status, "accepted")
      ),
      with: { requester: true, addressee: true },
    });
  }

  async listPendingReceived(userId: string) {
    return this.db.query.friendship.findMany({
      where: and(eq(friendship.addresseeId, userId), eq(friendship.status, "pending")),
      with: { requester: true },
    });
  }

  async delete(id: string) {
    return this.db.delete(friendship).where(eq(friendship.id, id)).returning();
  }
}
