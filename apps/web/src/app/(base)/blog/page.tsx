import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog - Anonymous Chat Tips, Guides & News",
  description:
    "Read the latest articles about anonymous chatting, online safety, meeting new people, and making friends online. Tips, guides, and insights from the Chatty team.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          Tips, guides, and insights about anonymous chatting, meeting new
          people online, and building meaningful connections.
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-muted-foreground">
          No posts yet. Check back soon!
        </p>
      ) : (
        <div className="space-y-8">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="rounded-xl border border-border p-6 hover:bg-muted/50 transition-colors"
            >
              <Link href={`/blog/${post.slug}` as any}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <time dateTime={post.date}>
                      {new Date(post.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                    <span>&middot;</span>
                    <span>{post.readingTime}</span>
                  </div>
                  <h2 className="text-xl font-bold hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {post.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
