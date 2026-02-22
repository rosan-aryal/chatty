import type { Context } from "hono";
import type { BlogService } from "./blog.service";

export class BlogController {
  constructor(private blogService: BlogService) {}

  list = async (c: Context) => {
    const posts = await this.blogService.listPublished();
    return c.json(posts);
  };

  getBySlug = async (c: Context) => {
    const slug = c.req.param("slug");
    const post = await this.blogService.getBySlug(slug);
    if (!post) return c.json({ error: "Post not found" }, 404);
    return c.json(post);
  };

  create = async (c: Context) => {
    const user = c.get("user") as { id: string };
    const body = await c.req.json<{
      title: string;
      slug: string;
      content: string;
      excerpt?: string;
      published?: boolean;
    }>();
    const post = await this.blogService.create(user.id, body);
    return c.json(post, 201);
  };

  update = async (c: Context) => {
    const id = c.req.param("id");
    const body = await c.req.json<Partial<{
      title: string;
      slug: string;
      content: string;
      excerpt: string;
      published: boolean;
    }>>();
    const post = await this.blogService.update(id, body);
    if (!post) return c.json({ error: "Post not found" }, 404);
    return c.json(post);
  };

  delete = async (c: Context) => {
    const id = c.req.param("id");
    const post = await this.blogService.delete(id);
    if (!post) return c.json({ error: "Post not found" }, 404);
    return c.json({ success: true });
  };
}
