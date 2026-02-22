import { eq } from "drizzle-orm";
import { blogPost } from "@chat-application/db/schema/blog";
import type { db as DB } from "@chat-application/db";

type Database = typeof DB;

export class BlogRepository {
  constructor(private db: Database) {}

  async findPublished() {
    return this.db.query.blogPost.findMany({
      where: eq(blogPost.published, true),
      orderBy: (post, { desc }) => [desc(post.createdAt)],
      with: { author: { columns: { id: true, name: true, image: true } } },
    });
  }

  async findBySlug(slug: string) {
    return this.db.query.blogPost.findFirst({
      where: eq(blogPost.slug, slug),
      with: { author: { columns: { id: true, name: true, image: true } } },
    });
  }

  async findById(id: string) {
    return this.db.query.blogPost.findFirst({
      where: eq(blogPost.id, id),
    });
  }

  async create(data: {
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    published?: boolean;
    authorId: string;
  }) {
    const [post] = await this.db.insert(blogPost).values(data).returning();
    return post;
  }

  async update(
    id: string,
    data: Partial<{
      title: string;
      slug: string;
      content: string;
      excerpt: string;
      published: boolean;
    }>,
  ) {
    const [post] = await this.db
      .update(blogPost)
      .set(data)
      .where(eq(blogPost.id, id))
      .returning();
    return post;
  }

  async delete(id: string) {
    const [post] = await this.db
      .delete(blogPost)
      .where(eq(blogPost.id, id))
      .returning();
    return post;
  }
}
