import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth";

// ── Blog Post ─────────────────────────────────────────────────────────

export const blogPost = pgTable(
  "blog_post",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    content: text("content").notNull(),
    excerpt: text("excerpt"),
    published: boolean("published").default(false).notNull(),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("blog_post_slug_idx").on(table.slug),
  ],
);

export const blogPostRelations = relations(blogPost, ({ one }) => ({
  author: one(user, {
    fields: [blogPost.authorId],
    references: [user.id],
  }),
}));
