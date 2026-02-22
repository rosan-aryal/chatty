import { eq } from "drizzle-orm";
import { contactMessage } from "@chat-application/db/schema/contact";
import type { db as DB } from "@chat-application/db";

type Database = typeof DB;

export class ContactRepository {
  constructor(private db: Database) {}

  async findAll() {
    return this.db.query.contactMessage.findMany({
      orderBy: (msg, { desc }) => [desc(msg.createdAt)],
    });
  }

  async findById(id: string) {
    return this.db.query.contactMessage.findFirst({
      where: eq(contactMessage.id, id),
    });
  }

  async create(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) {
    const [msg] = await this.db.insert(contactMessage).values(data).returning();
    return msg;
  }

  async markAsRead(id: string) {
    const [msg] = await this.db
      .update(contactMessage)
      .set({ read: true })
      .where(eq(contactMessage.id, id))
      .returning();
    return msg;
  }

  async delete(id: string) {
    const [msg] = await this.db
      .delete(contactMessage)
      .where(eq(contactMessage.id, id))
      .returning();
    return msg;
  }
}
