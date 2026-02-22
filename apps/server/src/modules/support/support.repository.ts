import { supportTicket, feedback } from "@chat-application/db/schema/support";
import type { db as DB } from "@chat-application/db";

type Database = typeof DB;

export class SupportRepository {
  constructor(private db: Database) {}

  async createTicket(data: { name: string; email: string; subject: string; message: string }) {
    const [ticket] = await this.db.insert(supportTicket).values(data).returning();
    return ticket;
  }

  async createFeedback(data: { name: string; email: string; rating: number; message: string }) {
    const [entry] = await this.db.insert(feedback).values(data).returning();
    return entry;
  }
}
