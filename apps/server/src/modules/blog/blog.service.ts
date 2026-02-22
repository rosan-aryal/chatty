import type { BlogRepository } from "./blog.repository";

export class BlogService {
  constructor(private blogRepo: BlogRepository) {}

  async listPublished() {
    return this.blogRepo.findPublished();
  }

  async getBySlug(slug: string) {
    return this.blogRepo.findBySlug(slug);
  }

  async create(authorId: string, data: {
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    published?: boolean;
  }) {
    return this.blogRepo.create({ ...data, authorId });
  }

  async update(id: string, data: Partial<{
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    published: boolean;
  }>) {
    return this.blogRepo.update(id, data);
  }

  async delete(id: string) {
    return this.blogRepo.delete(id);
  }
}
