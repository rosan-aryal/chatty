# Content & SEO Expansion Design

**Date:** 2026-02-24
**Scope:** Sidebar fixes, content pages, blog SSG, contact page, TanStack Query audit, in-app support/feedback, SEO

## Phase 1: Foundation & Fixes

### 1.1 Sidebar Collapsed State
- Add `group-data-[collapsible=icon]:hidden` to text elements in `app-sidebar.tsx` and `nav-main.tsx`
- Hide "Add Friend" button and empty state text when collapsed
- Verify nav-platform buttons collapse to icon-only with tooltips

### 1.2 TanStack Query Audit
- `groups/page.tsx`: Move `createdGroup` redirect from useEffect to mutation onSuccess
- All new code must use TanStack Query for data fetching
- Existing useEffect for DOM events/WebSocket subscriptions stays as-is (legitimate usage)

### 1.3 Support/Feedback In-App Modals
- Replace sidebar nav links (`/support`, `/feedback`) with modal dialog triggers
- Use shadcn Sheet/Dialog components within chat layout
- Keep same form logic (TanStack Form + Zod validation)
- Submit to existing backend endpoints

## Phase 2: Content Pages

### 2.1 Home Page Expansion
Target keywords: anonymous chat, chat with strangers, random chat online, meet new people, online chat rooms, group chat platform, make friends online, anonymous messaging

New sections:
1. Stats bar (conversations, countries, uptime)
2. How It Works (3-step process)
3. Detailed feature showcase
4. Use cases ("Why people love Chatty")
5. Comparison highlights
6. Testimonials
7. FAQ (keyword-rich Q&A)
8. Final CTA
9. Site-wide footer

### 2.2 Features Page
Full content page with 8 feature sections:
- Anonymous Chat, Gender Matching, Country Matching, Group Chats
- Friend System, Premium Features, Privacy Controls, Real-time Messaging
Each section: icon, heading, ~100-150 words keyword-targeted copy, visual element

### 2.3 Contact Page
- New page at `(base)/contact/page.tsx`
- Contact form: name, email, subject, message
- Uses TanStack Form + Zod (matching existing patterns)
- Submits to backend API

### 2.4 Blog System (MDX + SSG)
Architecture:
- `apps/web/src/content/blog/*.mdx` — blog post files
- `gray-matter` for frontmatter parsing
- `next-mdx-remote/rsc` for server-side MDX rendering
- `(base)/blog/page.tsx` — listing page (server component)
- `(base)/blog/[slug]/page.tsx` — post page with `generateStaticParams`
- Per-post metadata generation for SEO

Frontmatter schema: title, description, date, author, tags, slug, readingTime

10 seed blog posts:
1. "The Ultimate Guide to Anonymous Chat in 2026"
2. "How to Meet New People Online Safely"
3. "Group Chat vs Direct Messages: When to Use Each"
4. "Online Chat Safety Tips: Staying Secure While Making Friends"
5. "Why Anonymous Messaging is the Future of Online Communication"
6. "Best Random Chat Sites in 2026: A Complete Comparison"
7. "How to Build Genuine Friendships Through Online Chat"
8. "The Psychology of Anonymous Conversations"
9. "Country-Based Chat Matching: Connect With People From Your Region"
10. "Premium Chat Features That Actually Make a Difference"

## Phase 3: SEO Polish

### 3.1 Metadata & Structured Data
- Root layout: proper title template, description, OpenGraph, Twitter cards
- Per-page metadata exports for all content pages
- Blog posts get dynamic metadata from frontmatter

### 3.2 Technical SEO
- `sitemap.ts` — auto-generates sitemap including blog posts
- `robots.ts` — standard robots config
- Site-wide footer with keyword-rich internal links
