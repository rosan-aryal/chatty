# Content & SEO Expansion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand Chatty's content pages, fix sidebar collapse, add blog system with SSG, contact page, in-app support/feedback modals, and SEO improvements to drive organic traffic.

**Architecture:** Server-side content pages with MDX blog system using `gray-matter` + `next-mdx-remote/rsc` for SSG. In-app modals for support/feedback using shadcn Sheet. Site-wide footer and per-page SEO metadata. All new client-side fetching uses TanStack Query.

**Tech Stack:** Next.js 16, React 19, TailwindCSS 4, shadcn/ui (base-ui), TanStack Query, TanStack Form, Zod, gray-matter, next-mdx-remote, lucide-react

---

### Task 1: Fix Sidebar Collapsed State

**Files:**
- Modify: `apps/web/src/components/sidebar/nav-main.tsx`
- Modify: `apps/web/src/components/sidebar/app-sidebar.tsx`

**Step 1: Fix nav-main.tsx collapsed overflow**

In `apps/web/src/components/sidebar/nav-main.tsx`, the "Add Friend" button and empty state text overflow when sidebar is collapsed. Add `group-data-[collapsible=icon]:hidden` classes.

Changes to `nav-main.tsx`:
1. On the `SidebarGroupLabel` wrapper `<span>` for "Friends" text + online count — wrap contents so label works in collapsed mode
2. On the "Add Friend" `<Button>` — add `group-data-[collapsible=icon]:hidden`
3. On the empty state `<div>` ("No friends yet...") — add `group-data-[collapsible=icon]:hidden`

```tsx
// SidebarGroupLabel should become:
<SidebarGroupLabel className="flex items-center justify-between">
  <span className="inline-flex items-center gap-2">
    Friends
    {onlineFriends.length > 0 && (
      <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        {onlineFriends.length}
      </span>
    )}
  </span>
  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 group-data-[collapsible=icon]:hidden">
    <span className="sr-only">Add Friend</span>
    <UserPlus className="h-3.5 w-3.5" />
  </Button>
</SidebarGroupLabel>
```

Empty state div:
```tsx
<div className="px-2 py-3 text-center text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
  No friends yet. Start a chat to connect!
</div>
```

**Step 2: Verify app-sidebar.tsx logo section**

The logo in `app-sidebar.tsx` already uses `SidebarMenuButton size="lg"` which auto-handles icon collapse. The inner text div (`<div className="grid flex-1 ...">`) is already wrapped in a flex layout that the sidebar hides automatically. Verify this by checking that `SidebarMenuButton` with `size="lg"` applies `group-data-[collapsible=icon]:p-0!` (it does per sidebar.tsx line 489). No changes needed here.

**Step 3: Commit**

```bash
git add apps/web/src/components/sidebar/nav-main.tsx
git commit -m "fix: hide add-friend button and empty state when sidebar collapsed"
```

---

### Task 2: Fix TanStack Query — Migrate useCreateGroup

**Files:**
- Modify: `apps/web/src/hooks/use-create-group.ts`
- Modify: `apps/web/src/app/(chat)/chat/groups/page.tsx`

**Step 1: Rewrite use-create-group.ts with useMutation**

Replace the manual useState-based hook with TanStack Query `useMutation`:

```ts
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Group } from "@/types/groups";
import { env } from "@chat-application/env/web";

const API = env.NEXT_PUBLIC_SERVER_URL;

export function useCreateGroup() {
  return useMutation({
    mutationFn: async (data: {
      name: string;
      type: "public" | "private";
      maxMembers: number;
    }): Promise<Group> => {
      if (!data.name.trim()) {
        throw new Error("Group name is required");
      }
      const res = await fetch(`${API}/api/groups`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to create group");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Group created!");
    },
    onError: (e: Error) => {
      toast.error(e.message || "Something went wrong");
    },
  });
}
```

**Step 2: Update groups/page.tsx to use new hook shape**

In `apps/web/src/app/(chat)/chat/groups/page.tsx`:
- Remove the `useEffect` for `createdGroup` redirect
- Change `useCreateGroup()` destructuring from `{ createGroup, isPending, createdGroup }` to `createGroup` (the mutation object)
- Use `createGroup.mutate(data, { onSuccess: (group) => router.push(...) })` pattern

Replace:
```tsx
const { createGroup, isPending, createdGroup } = useCreateGroup();

useEffect(() => {
  if (createdGroup) {
    router.push(`/chat/groups/${createdGroup.id}` as any);
  }
}, [createdGroup, router]);
```

With:
```tsx
const createGroup = useCreateGroup();
```

And where `createGroup(...)` was called, replace with:
```tsx
createGroup.mutate(
  { name: newName, type: newType, maxMembers: newMaxMembers },
  {
    onSuccess: (group) => {
      router.push(`/chat/groups/${group.id}` as any);
    },
  }
);
```

And where `isPending` was referenced, replace with `createGroup.isPending`.

**Step 3: Commit**

```bash
git add apps/web/src/hooks/use-create-group.ts apps/web/src/app/\(chat\)/chat/groups/page.tsx
git commit -m "refactor: migrate useCreateGroup to TanStack Query useMutation"
```

---

### Task 3: Add shadcn Dialog Component

**Files:**
- Create: `apps/web/src/components/ui/dialog.tsx`

**Step 1: Install shadcn dialog**

```bash
cd apps/web && npx shadcn@latest add dialog
```

If this fails (base-ui version), create manually based on the Sheet pattern (which already uses `@base-ui/react/dialog`). The dialog component file will be auto-generated by shadcn CLI.

**Step 2: Commit**

```bash
git add apps/web/src/components/ui/dialog.tsx
git commit -m "chore: add shadcn dialog component"
```

---

### Task 4: In-App Support/Feedback Modals

**Files:**
- Create: `apps/web/src/components/sidebar/support-dialog.tsx`
- Create: `apps/web/src/components/sidebar/feedback-dialog.tsx`
- Modify: `apps/web/src/components/sidebar/app-sidebar.tsx`
- Modify: `apps/web/src/components/sidebar/nav-secondary.tsx`

**Step 1: Create support-dialog.tsx**

This is a dialog containing the support form. Extract the form from `apps/web/src/app/(base)/support/page.tsx` into a dialog:

```tsx
"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LifeBuoy } from "lucide-react";
import { env } from "@chat-application/env/web";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { SidebarMenuButton } from "@/components/ui/sidebar";

const supportSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export function SupportDialog() {
  const form = useForm({
    defaultValues: { name: "", email: "", subject: "", message: "" },
    onSubmit: async ({ value }) => {
      const parsed = supportSchema.safeParse(value);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return;
      }
      const res = await fetch(
        `${env.NEXT_PUBLIC_SERVER_URL}/api/support/ticket`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        },
      );
      if (res.ok) {
        toast.success("Support request submitted!");
        form.reset();
      } else {
        toast.error("Failed to submit. Please try again.");
      }
    },
  });

  return (
    <Sheet>
      <SheetTrigger
        render={
          <SidebarMenuButton size="sm">
            <LifeBuoy className="h-4 w-4" />
            <span>Support</span>
          </SidebarMenuButton>
        }
      />
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Support</SheetTitle>
          <SheetDescription>How can we help you?</SheetDescription>
        </SheetHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4 p-4"
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
                  placeholder="Brief description"
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
                  placeholder="Tell us more..."
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
      </SheetContent>
    </Sheet>
  );
}
```

**Step 2: Create feedback-dialog.tsx**

Same pattern but with star rating:

```tsx
"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Send, Star } from "lucide-react";
import { useState } from "react";
import { env } from "@chat-application/env/web";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarMenuButton } from "@/components/ui/sidebar";

const feedbackSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  rating: z.number().min(1, "Please select a rating").max(5),
  message: z.string().min(5, "Please provide some feedback"),
});

export function FeedbackDialog() {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  const form = useForm({
    defaultValues: { name: "", email: "", message: "" },
    onSubmit: async ({ value }) => {
      const parsed = feedbackSchema.safeParse({ ...value, rating });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return;
      }
      const res = await fetch(
        `${env.NEXT_PUBLIC_SERVER_URL}/api/support/feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        },
      );
      if (res.ok) {
        toast.success("Thank you for your feedback!");
        form.reset();
        setRating(0);
      } else {
        toast.error("Failed to submit. Please try again.");
      }
    },
  });

  return (
    <Sheet>
      <SheetTrigger
        render={
          <SidebarMenuButton size="sm">
            <Send className="h-4 w-4" />
            <span>Feedback</span>
          </SidebarMenuButton>
        }
      />
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Feedback</SheetTitle>
          <SheetDescription>We'd love to hear from you</SheetDescription>
        </SheetHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4 p-4"
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
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-0.5"
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <form.Field name="message">
            {(field) => (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Your Feedback</label>
                <textarea
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="What do you think about Chatty?"
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
            )}
          </form.Field>
          <Button type="submit" className="w-full">
            Send Feedback
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
```

**Step 3: Update app-sidebar.tsx to use dialog components**

Replace the `navSecondary` array and `<NavSecondary>` with inline dialog components:

```tsx
// Remove: import { NavSecondary } from "@/components/sidebar/nav-secondary";
// Remove: const navSecondary = [...]
// Add:
import { SupportDialog } from "./support-dialog";
import { FeedbackDialog } from "./feedback-dialog";
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";

// Replace <NavSecondary items={navSecondary} className="mt-auto" /> with:
<SidebarGroup className="mt-auto">
  <SidebarGroupContent>
    <SidebarMenu>
      <SidebarMenuItem>
        <SupportDialog />
      </SidebarMenuItem>
      <SidebarMenuItem>
        <FeedbackDialog />
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarGroupContent>
</SidebarGroup>
```

**Step 4: Commit**

```bash
git add apps/web/src/components/sidebar/support-dialog.tsx apps/web/src/components/sidebar/feedback-dialog.tsx apps/web/src/components/sidebar/app-sidebar.tsx
git commit -m "feat: add in-app support and feedback modal dialogs in sidebar"
```

---

### Task 5: Site-Wide Footer Component

**Files:**
- Create: `apps/web/src/components/footer.tsx`
- Modify: `apps/web/src/app/(base)/layout.tsx`

**Step 1: Create footer component**

Create `apps/web/src/components/footer.tsx` — a keyword-rich footer with internal links:

```tsx
import Link from "next/link";

const footerLinks = {
  Platform: [
    { name: "Anonymous Chat", href: "/features" },
    { name: "Group Chat Rooms", href: "/features" },
    { name: "Random Chat Online", href: "/chat" },
    { name: "Gender Matching", href: "/features" },
    { name: "Country Matching", href: "/features" },
  ],
  Company: [
    { name: "About Chatty", href: "/" },
    { name: "Pricing", href: "/pricing" },
    { name: "Blog", href: "/blog" },
    { name: "Contact Us", href: "/contact" },
  ],
  Support: [
    { name: "Help Center", href: "/support" },
    { name: "Send Feedback", href: "/feedback" },
    { name: "Safety Tips", href: "/blog/online-chat-safety-tips" },
    { name: "Privacy Guide", href: "/blog/anonymous-messaging-future" },
  ],
  Legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-primary via-secondary to-primary/55 text-sm font-bold shadow">
                C
              </div>
              <span className="text-lg font-bold">Chatty</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              The anonymous chat platform where you can meet new people, join group chats, and make friends online — all in real time.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="text-sm font-semibold">{title}</h3>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href as any}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Chatty. Anonymous chat platform for meeting new people online.
          </p>
          <p className="text-xs text-muted-foreground">
            Chat with strangers safely. Make friends worldwide.
          </p>
        </div>
      </div>
    </footer>
  );
}
```

**Step 2: Add footer to base layout**

In `apps/web/src/app/(base)/layout.tsx`:

```tsx
import React from "react";
import Header from "@/components/header";
import { Footer } from "@/components/footer";

const BaseLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default BaseLayout;
```

**Step 3: Commit**

```bash
git add apps/web/src/components/footer.tsx apps/web/src/app/\(base\)/layout.tsx
git commit -m "feat: add site-wide footer with keyword-rich internal links"
```

---

### Task 6: Home Page Content Expansion

**Files:**
- Modify: `apps/web/src/app/(base)/page.tsx`

**Step 1: Rewrite home page with expanded SEO content**

Replace the entire `apps/web/src/app/(base)/page.tsx` with a content-rich page. Keep the existing hero and features grid but add these new sections below:

1. **Stats bar** — social proof numbers
2. **How It Works** — 3-step visual flow
3. **Use Cases** — "Why People Love Chatty" scenarios
4. **Comparison** — what makes Chatty different
5. **Testimonials** — representative quotes
6. **FAQ** — keyword-rich Q&A
7. **Final CTA** — conversion section

The full page should be a server component (no "use client"). Use lucide-react icons. Target these keywords naturally throughout: anonymous chat, chat with strangers, random chat online, meet new people, online chat rooms, group chat platform, make friends online, anonymous messaging, free chat, chat without registration.

Each section should have an `<h2>` with keyword-rich heading, supporting paragraph, and visual content. Aim for ~2000-2500 words of content total across all sections.

The FAQ section should use simple disclosure/accordion pattern with `<details>/<summary>` HTML elements (no JS needed). Include 8-10 questions targeting long-tail keywords.

**Step 2: Commit**

```bash
git add apps/web/src/app/\(base\)/page.tsx
git commit -m "feat: expand home page with SEO content sections"
```

---

### Task 7: Features Page

**Files:**
- Modify: `apps/web/src/app/(base)/features/page.tsx`

**Step 1: Build full features page**

Replace the placeholder with a comprehensive features page. Server component (no "use client").

Structure:
1. **Hero** — "Everything You Need for Anonymous Chat"
2. **8 Feature sections** — alternating layout (image left/right), each with:
   - Icon + heading
   - 100-150 words of keyword-targeted description
   - Feature highlights as bullet list

Features to detail:
1. Anonymous Chat — chat with strangers without revealing identity
2. Random Matching — instant pairing with new people worldwide
3. Gender Preference Matching — choose who you connect with (premium)
4. Country-Based Matching — find people from specific regions
5. Group Chat Rooms — public and private community spaces
6. Friend System — save connections, build lasting friendships
7. Real-Time Messaging — WebSocket-powered instant delivery
8. Privacy Controls — toggle anonymity, control visibility

3. **CTA section** — "Ready to Start Chatting?"

Add `export const metadata` for SEO at top of file.

**Step 2: Commit**

```bash
git add apps/web/src/app/\(base\)/features/page.tsx
git commit -m "feat: add full features page with keyword-targeted content"
```

---

### Task 8: Contact Page

**Files:**
- Create: `apps/web/src/app/(base)/contact/page.tsx`

**Step 1: Create contact page**

Create `apps/web/src/app/(base)/contact/page.tsx`. Use the same pattern as the existing support page but as a public-facing contact form. Uses TanStack Form + Zod for validation. Submit to the existing `/api/support/ticket` endpoint (or create separate — reusing is fine).

```tsx
"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { env } from "@chat-application/env/web";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export default function ContactPage() {
  const form = useForm({
    defaultValues: { name: "", email: "", subject: "", message: "" },
    onSubmit: async ({ value }) => {
      const parsed = contactSchema.safeParse(value);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message);
        return;
      }
      const res = await fetch(
        `${env.NEXT_PUBLIC_SERVER_URL}/api/support/ticket`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        },
      );
      if (res.ok) {
        toast.success("Message sent! We'll get back to you soon.");
        form.reset();
      } else {
        toast.error("Failed to send. Please try again.");
      }
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center mb-12">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Contact Us</h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          Have a question about our anonymous chat platform? Want to report an issue or suggest a feature? We'd love to hear from you.
        </p>
      </div>

      <div className="mx-auto max-w-lg">
        <div className="rounded-xl border border-border bg-card p-8 shadow-lg space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            {/* Same form fields as support page: name, email, subject, message */}
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
                    placeholder="What's this about?"
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
                    placeholder="Tell us more..."
                    rows={5}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  />
                </div>
              )}
            </form.Field>
            <Button type="submit" className="w-full">
              Send Message
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
```

Also add a metadata wrapper or separate layout `metadata` export. Since this is a client component, add a separate `metadata` export via a layout or use `generateMetadata` in a parent. Simplest: create a wrapper — but actually for a client component, export metadata from a separate file. The easiest approach: make the form a separate component and keep the page as server component with metadata export.

Alternative simpler approach: Just add the metadata in the `(base)/contact/layout.tsx` or keep the contact page as client and rely on the root metadata (less ideal). Best: split into server page + client form component.

Actually simplest: the page IS client-side because of the form, but you can still export `metadata` from a client component in Next.js 16 — NO, you cannot. So either:
- Create `apps/web/src/app/(base)/contact/layout.tsx` with metadata export, OR
- Make a `ContactForm` client component and keep page.tsx as server component

Go with option 2: create `apps/web/src/components/contact-form.tsx` as "use client", and keep `apps/web/src/app/(base)/contact/page.tsx` as server component with metadata.

**Step 2: Commit**

```bash
git add apps/web/src/app/\(base\)/contact/page.tsx apps/web/src/components/contact-form.tsx
git commit -m "feat: add contact page with form"
```

---

### Task 9: Blog System Setup

**Files:**
- Install: `gray-matter`, `next-mdx-remote`
- Create: `apps/web/src/lib/blog.ts` — blog utilities (read MDX, parse frontmatter)
- Create: `apps/web/src/content/blog/` directory
- Modify: `apps/web/src/app/(base)/blog/page.tsx` — listing page
- Create: `apps/web/src/app/(base)/blog/[slug]/page.tsx` — post page with SSG

**Step 1: Install dependencies**

```bash
cd apps/web && pnpm add gray-matter next-mdx-remote
```

**Step 2: Create blog utility library**

Create `apps/web/src/lib/blog.ts`:

```ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  readingTime: string;
  content: string;
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));

  const posts = files.map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf-8");
    const { data, content } = matter(raw);

    return {
      slug,
      title: data.title ?? "",
      description: data.description ?? "",
      date: data.date ?? "",
      author: data.author ?? "Chatty Team",
      tags: data.tags ?? [],
      readingTime: data.readingTime ?? `${Math.ceil(content.split(/\s+/).length / 200)} min read`,
      content,
    };
  });

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  const posts = getAllPosts();
  return posts.find((p) => p.slug === slug);
}
```

**Step 3: Create blog listing page**

Replace `apps/web/src/app/(base)/blog/page.tsx`:

```tsx
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog - Anonymous Chat Tips, Guides & News | Chatty",
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
```

**Step 4: Create blog post page with SSG**

Create `apps/web/src/app/(base)/blog/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} | Chatty Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Blog
      </Link>

      <header className="mb-8 space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <span>&middot;</span>
          <span>{post.readingTime}</span>
          <span>&middot;</span>
          <span>{post.author}</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
        <p className="text-lg text-muted-foreground">{post.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <MDXRemote source={post.content} />
      </div>
    </article>
  );
}
```

**Step 5: Commit**

```bash
git add apps/web/src/lib/blog.ts apps/web/src/app/\(base\)/blog/ apps/web/package.json pnpm-lock.yaml
git commit -m "feat: add blog system with MDX + SSG support"
```

---

### Task 10: Blog Content — Posts 1-5

**Files:**
- Create: `apps/web/src/content/blog/ultimate-guide-anonymous-chat.mdx`
- Create: `apps/web/src/content/blog/meet-new-people-online-safely.mdx`
- Create: `apps/web/src/content/blog/group-chat-vs-direct-messages.mdx`
- Create: `apps/web/src/content/blog/online-chat-safety-tips.mdx`
- Create: `apps/web/src/content/blog/anonymous-messaging-future.mdx`

**Step 1: Write 5 blog posts**

Each post should have:
- Frontmatter: title, description, date, author, tags, readingTime
- 800-1200 words of original content
- Natural keyword usage (anonymous chat, chat with strangers, meet new people online, random chat, group chat, online safety)
- H2/H3 subheadings for structure
- Actionable tips or insights
- Internal links to Chatty features where relevant

Example frontmatter format:
```yaml
---
title: "The Ultimate Guide to Anonymous Chat in 2026"
description: "Everything you need to know about anonymous chat platforms, how they work, and how to make the most of chatting with strangers online."
date: "2026-02-20"
author: "Chatty Team"
tags: ["anonymous chat", "guide", "chat with strangers"]
readingTime: "6 min read"
---
```

Content guidelines:
- Write naturally, not keyword-stuffed
- Include practical advice
- Reference Chatty features organically
- Use engaging subheadings

**Step 2: Commit**

```bash
git add apps/web/src/content/blog/
git commit -m "content: add first 5 blog posts for SEO"
```

---

### Task 11: Blog Content — Posts 6-10

**Files:**
- Create: `apps/web/src/content/blog/best-random-chat-sites.mdx`
- Create: `apps/web/src/content/blog/build-genuine-friendships-online.mdx`
- Create: `apps/web/src/content/blog/psychology-anonymous-conversations.mdx`
- Create: `apps/web/src/content/blog/country-based-chat-matching.mdx`
- Create: `apps/web/src/content/blog/premium-chat-features.mdx`

**Step 1: Write 5 more blog posts**

Same guidelines as Task 10. Topics:
1. Best random chat sites comparison (2026)
2. Building genuine friendships through online chat
3. The psychology of anonymous conversations
4. Country-based chat matching and finding regional connections
5. Premium chat features and why they matter

Each 800-1200 words with natural keyword integration.

**Step 2: Commit**

```bash
git add apps/web/src/content/blog/
git commit -m "content: add blog posts 6-10 for SEO"
```

---

### Task 12: SEO — Root Metadata & Per-Page Metadata

**Files:**
- Modify: `apps/web/src/app/layout.tsx` — root metadata with title template
- Modify: `apps/web/src/app/(base)/page.tsx` — home page metadata
- Modify: `apps/web/src/app/(base)/features/page.tsx` — features metadata (already added in Task 7)

**Step 1: Update root layout metadata**

In `apps/web/src/app/layout.tsx`, replace the metadata:

```ts
export const metadata: Metadata = {
  title: {
    default: "Chatty - Anonymous Chat Platform | Chat with Strangers Online",
    template: "%s | Chatty",
  },
  description:
    "Chat with strangers anonymously, join group chat rooms, and make friends online. Chatty is the free anonymous chat platform with gender matching, country matching, and real-time messaging.",
  keywords: [
    "anonymous chat",
    "chat with strangers",
    "random chat online",
    "meet new people",
    "online chat rooms",
    "group chat platform",
    "make friends online",
    "anonymous messaging",
    "free chat",
    "random chat",
  ],
  openGraph: {
    type: "website",
    siteName: "Chatty",
    title: "Chatty - Anonymous Chat Platform | Chat with Strangers Online",
    description:
      "Chat with strangers anonymously, join group chat rooms, and make friends online. Free anonymous chat with gender and country matching.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chatty - Anonymous Chat Platform",
    description:
      "Chat with strangers anonymously. Join group chats, make friends, and connect worldwide.",
  },
  robots: {
    index: true,
    follow: true,
  },
};
```

**Step 2: Add home page metadata**

In `apps/web/src/app/(base)/page.tsx`, add metadata export:

```ts
export const metadata: Metadata = {
  title: "Chatty - Free Anonymous Chat Platform | Meet New People Online",
  description:
    "Start chatting with strangers instantly on Chatty. Anonymous chat rooms, random matching, group chats, and friend system. No sign-up needed to start. Meet new people online for free.",
};
```

**Step 3: Commit**

```bash
git add apps/web/src/app/layout.tsx apps/web/src/app/\(base\)/page.tsx
git commit -m "feat: add comprehensive SEO metadata to all pages"
```

---

### Task 13: SEO — Sitemap & Robots

**Files:**
- Create: `apps/web/src/app/sitemap.ts`
- Create: `apps/web/src/app/robots.ts`

**Step 1: Create sitemap.ts**

```ts
import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://chatty.app"; // Update with actual domain

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${baseUrl}/features`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.5 },
    { url: `${baseUrl}/support`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.3 },
    { url: `${baseUrl}/feedback`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.3 },
  ];

  const blogPosts = getAllPosts().map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...blogPosts];
}
```

**Step 2: Create robots.ts**

```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/chat/", "/api/", "/onboarding"],
      },
    ],
    sitemap: "https://chatty.app/sitemap.xml", // Update with actual domain
  };
}
```

**Step 3: Commit**

```bash
git add apps/web/src/app/sitemap.ts apps/web/src/app/robots.ts
git commit -m "feat: add sitemap.ts and robots.ts for SEO"
```

---

### Task 14: Final Verification

**Step 1: Type check**

```bash
cd apps/web && npx tsc --noEmit
```

Expected: no errors

**Step 2: Build check**

```bash
cd apps/web && pnpm build
```

Expected: successful build with all pages generated. Blog posts should show as statically generated.

**Step 3: Visual check**

Start dev server and verify:
- Home page: all new sections render correctly
- Features page: 8 feature sections display
- Blog listing: all 10 posts listed with correct dates/tags
- Blog post: individual posts render MDX content
- Contact page: form submits correctly
- Sidebar: collapses cleanly, no overflow
- Sidebar: Support/Feedback open as modal sheets
- Footer: displays on all public pages with correct links

**Step 4: Final commit if any fixes needed**

```bash
git add -A && git commit -m "fix: address build/type issues from content expansion"
```
