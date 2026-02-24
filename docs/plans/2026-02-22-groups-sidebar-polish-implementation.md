# Groups, Sidebar & Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix group message ownership, add group creation dialog, group settings/ban, avatars in chat, gender matching sidebar buttons, collapsible sidebar icons, and missing pages.

**Architecture:** Mostly frontend changes with one DB schema addition (group_ban table). Group creation moves to a dialog on the groups list page. Message ownership fixed by comparing senderId to current userId. Sidebar gets icons for collapsed mode and 4 gender matching buttons.

**Tech Stack:** Next.js, React, TanStack Query, Hono, Drizzle ORM, Tailwind CSS, lucide-react, WebSocket

---

### Task 1: Fix message ownership bug in group chat history

**Files:**
- Modify: `apps/web/src/hooks/use-group-chat.ts`
- Modify: `apps/web/src/types/chat.ts`

**Step 1: Update ChatMessage type to include senderId**

In `apps/web/src/types/chat.ts`, add optional `senderId`:
```typescript
export interface ChatMessage {
  content: string;
  senderName: string;
  timestamp: string;
  isOwn: boolean;
  senderId?: string;
}
```

**Step 2: Fix the history mapping to compare senderId**

In `apps/web/src/hooks/use-group-chat.ts`, the hook needs the current user's ID. Import and use `useProfile`:

```typescript
import { useProfile } from "@/hooks/use-profile";
```

Inside the hook, add:
```typescript
const { data: profile } = useProfile();
```

Change the history useEffect (lines 39-49) from hardcoded `isOwn: false` to:
```typescript
useEffect(() => {
  if (history.length > 0 && profile) {
    const mapped = [...history].reverse().map((m: any) => ({
      content: m.content,
      senderName: m.sender?.name || "Unknown",
      timestamp: m.createdAt,
      isOwn: m.senderId === profile.id,
      senderId: m.senderId,
    }));
    setMessages(mapped);
  }
}, [history, profile]);
```

Also add `senderId` to real-time message handler and to `sendMessage`:
- In the `group:message` handler: add `senderId: data.senderId`
- In `sendMessage`: add `senderId: profile?.id`

**Step 3: Commit**

---

### Task 2: Move group creation to dialog on groups page

**Files:**
- Modify: `apps/web/src/app/(chat)/chat/groups/page.tsx`
- Delete content of: `apps/web/src/app/(chat)/chat/groups/create/page.tsx` (redirect to /chat/groups)

**Step 1: Add create group dialog to groups page**

Add a `showCreate` state and create dialog in the groups page. The dialog contains the same form fields (name, type, maxMembers). On success, redirect to `/chat/groups/[groupId]`.

Replace the `<Link href="/chat/groups/create">` button with `onClick={() => setShowCreate(true)}`.

Add the dialog markup (same pattern as the existing "Join by Code" modal):
```typescript
{showCreate && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
    <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-lg space-y-4" onClick={(e) => e.stopPropagation()}>
      <h3 className="text-lg font-semibold">Create a Group</h3>
      {/* name input, type selector, maxMembers input, create button */}
      {/* On success: router.push(`/chat/groups/${createdGroup.id}`) */}
    </div>
  </div>
)}
```

Import `useCreateGroup` and `useRouter`. After creation, immediately redirect.

**Step 2: Update create page to redirect**

Replace `apps/web/src/app/(chat)/chat/groups/create/page.tsx` with a redirect to `/chat/groups`:
```typescript
import { redirect } from "next/navigation";
export default function CreateGroupPage() {
  redirect("/chat/groups");
}
```

**Step 3: Commit**

---

### Task 3: Add avatars to message bubbles

**Files:**
- Modify: `apps/web/src/components/chat/message-bubble.tsx`
- Modify: `apps/web/src/types/chat.ts`

**Step 1: Extend ChatMessage with avatar info**

In `apps/web/src/types/chat.ts`:
```typescript
export interface ChatMessage {
  content: string;
  senderName: string;
  timestamp: string;
  isOwn: boolean;
  senderId?: string;
  senderImage?: string;
  isAnonymous?: boolean;
}
```

**Step 2: Update MessageBubble to show avatars**

Add `senderImage` and `isAnonymous` props to `MessageBubbleProps`. Show an avatar next to each message:
- Own messages: avatar on right
- Others: avatar on left
- Anonymous users: show a `User` icon in a circle instead of image
- Non-anonymous: show image or initials fallback

```typescript
import { User } from "lucide-react";

interface MessageBubbleProps {
  content: string;
  senderName: string;
  timestamp: string;
  isOwn: boolean;
  senderImage?: string;
  isAnonymous?: boolean;
}
```

Layout: wrap in flex with avatar + bubble. Avatar is a 32x32 circle.

**Step 3: Update group chat hook to pass sender info**

In `use-group-chat.ts`, when mapping history, include `senderImage` and `isAnonymous` from the sender data.

**Step 4: Commit**

---

### Task 4: Update sidebar with gender matching buttons and icons

**Files:**
- Modify: `apps/web/src/components/sidebar/nav-platform.tsx`

**Step 1: Replace single Gender Chat button with 4 matching options**

Remove the single "Gender Chat" button. Add 4 separate buttons:
- F → F Matching
- F → M Matching
- M → F Matching
- M → M Matching

Each button:
- If premium: navigates to `/chat/anonymously?genderPref={target}` (where target is the gender they want to match with)
- If not premium: navigates to `/pricing`
- Shows "PRO" badge when not premium

**Step 2: Add icons and fix collapsed mode**

Remove `group-data-[collapsible=icon]:hidden` from the SidebarGroup so it shows in collapsed mode.

Add icons to each button:
- Random Chat: `Shuffle` icon
- F→F, F→M, M→F, M→M: Use appropriate icons or emoji text
- Group Chats: `Users` icon

Use `SidebarMenuButton` with `tooltip` prop for collapsed state tooltips.

**Step 3: Commit**

---

### Task 5: Add group settings with member management and ban

**Files:**
- Create: `packages/db/src/schema/chat.ts` (add groupBan table)
- Modify: `packages/db/src/schema/chat.ts` (add groupBan + relations)
- Create: `apps/web/src/components/chat/group-settings.tsx`
- Modify: `apps/web/src/app/(chat)/chat/groups/[groupId]/page.tsx`
- Modify: `apps/server/src/modules/group/group.repository.ts` (add ban methods)
- Modify: `apps/server/src/modules/group/group.service.ts` (add ban logic)
- Modify: `apps/server/src/modules/group/group.controller.ts` (add ban endpoints)
- Modify: `apps/server/src/modules/group/group.routes.ts` (add ban routes)

**Step 1: Add groupBan table to schema**

In `packages/db/src/schema/chat.ts`:
```typescript
export const groupBan = pgTable("group_ban", {
  groupId: uuid("group_id").notNull().references(() => group.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  bannedBy: text("banned_by").notNull().references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  { columns: [table.groupId, table.userId], name: "group_ban_pk" }
]);
```

Add relations. Export from schema index.

**Step 2: Add ban repository methods**

In group.repository.ts:
- `banMember(groupId, userId, bannedBy)` - insert into groupBan, remove from groupMember
- `unbanMember(groupId, userId)` - delete from groupBan
- `isBanned(groupId, userId)` - check if banned
- `listBans(groupId)` - list banned users

**Step 3: Add ban service methods**

In group.service.ts:
- `ban(groupId, targetUserId, requesterId)` - check role, ban + kick
- `unban(groupId, targetUserId, requesterId)` - check role, unban
- Check ban status in `joinPublic` and `joinByCode` methods

**Step 4: Add ban controller endpoints**

In group.controller.ts:
- `ban` handler
- `unban` handler

In group.routes.ts:
- `POST /:id/ban`
- `POST /:id/unban`

**Step 5: Create GroupSettings component**

A sheet/dialog with:
- Member list showing avatar, name, role badge
- Kick button (for host/admin, not on host)
- Ban button (for host/admin, not on host)
- Banned users tab with unban button
- Delete group button (host only)
- Regenerate invite code (host only, private)

**Step 6: Add settings button to group chat header**

In the group chat page, add a gear icon button that opens GroupSettings.

**Step 7: Commit**

---

### Task 6: Create missing pages (not-found, error, friends list, pricing, home)

**Files:**
- Create: `apps/web/src/app/not-found.tsx`
- Create: `apps/web/src/app/error.tsx`
- Create: `apps/web/src/app/(chat)/chat/friends/page.tsx`
- Modify: `apps/web/src/app/(base)/pricing/page.tsx`
- Modify: `apps/web/src/app/(base)/page.tsx` (home page)

**Step 1: Global not-found page**

```typescript
import Link from "next/link";
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-muted-foreground">Page not found</p>
      <Link href="/" className="text-primary hover:underline">Go home</Link>
    </div>
  );
}
```

**Step 2: Global error page**

```typescript
"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Something went wrong</h1>
      <p className="text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="text-primary hover:underline">Try again</button>
    </div>
  );
}
```

**Step 3: Friends list page**

Create `apps/web/src/app/(chat)/chat/friends/page.tsx` showing all friends with online status, link to their DM chat.

**Step 4: Improve pricing page**

Replace the stub with a proper pricing comparison (Free vs Premium) with feature list and upgrade button.

**Step 5: Improve home page**

Replace stub with a landing page hero section, feature highlights, and CTA to sign up.

**Step 6: Commit**

---

### Task 7: Generate migration and verify

**Step 1: Generate migration**
Run: `cd packages/db && bun run db:generate`

**Step 2: Type check**
Run: `bun run check-types`

**Step 3: Commit migration**
