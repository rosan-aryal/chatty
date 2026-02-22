"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LifeBuoy, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { env } from "@chat-application/env/web";

const supportSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export default function SupportPage() {
  const form = useForm({
    defaultValues: { name: "", email: "", subject: "", message: "" },
    onSubmit: async ({ value }) => {
      const parsed = supportSchema.safeParse(value);
      if (!parsed.success) {
        toast.error(parsed.error.errors[0].message);
        return;
      }
      const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/api/support/ticket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (res.ok) {
        toast.success("Support request submitted!");
        form.reset();
      } else {
        toast.error("Failed to submit. Please try again.");
      }
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <Link
          href="/chat"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Chat
        </Link>
        <div className="rounded-xl border border-border bg-card p-8 shadow-lg space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <LifeBuoy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Support</h1>
              <p className="text-sm text-muted-foreground">How can we help you?</p>
            </div>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <form.Field name="name">
              {(field) => (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Name</label>
                  <input
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Your name"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="email">
              {(field) => (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="you@example.com"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="subject">
              {(field) => (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Subject</label>
                  <input
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Brief description of your issue"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="message">
              {(field) => (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Message</label>
                  <textarea
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Tell us more about your issue..."
                    rows={4}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                </div>
              )}
            </form.Field>
            <Button type="submit" className="w-full">
              Submit Request
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
