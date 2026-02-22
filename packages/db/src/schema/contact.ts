import { pgTable, text, timestamp, boolean, uuid } from "drizzle-orm/pg-core";

// ── Contact Message ───────────────────────────────────────────────────

export const contactMessage = pgTable("contact_message", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
