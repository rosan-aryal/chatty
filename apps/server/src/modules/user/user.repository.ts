import { eq } from "drizzle-orm";
import { user } from "@chat-application/db/schema/auth";
import type { db as DB } from "@chat-application/db";

type Database = typeof DB;

export class UserRepository {
  constructor(private db: Database) {}

  async findById(id: string) {
    return this.db.query.user.findFirst({
      where: eq(user.id, id),
    });
  }

  async updateProfile(
    id: string,
    data: { gender?: "male" | "female" | "other"; country?: string; onboarded?: boolean; isAnonymous?: boolean }
  ) {
    return this.db
      .update(user)
      .set(data)
      .where(eq(user.id, id))
      .returning();
  }
}
