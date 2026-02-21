# Chat Platform Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a real-time anonymous chat platform with matchmaking, groups, friends, notifications, and Stripe premium subscriptions.

**Architecture:** Hono + Bun backend with WebSocket, Next.js 16 frontend, PostgreSQL via Drizzle ORM, Bun's built-in Redis for matchmaking queues and pub/sub, Better Auth with Google OAuth + Stripe plugin. Backend uses module-based structure with DI (repository -> service -> controller).

**Tech Stack:** Bun, Hono, Next.js 16, React 19, TanStack Query, Drizzle ORM, PostgreSQL, Bun.redis, Better Auth, @better-auth/stripe, Stripe, shadcn/ui, Tailwind CSS 4, Framer Motion

**Design Doc:** `docs/plans/2026-02-22-chat-platform-design.md`

---

## Phase 1: Foundation - Database Schema & Infrastructure

### Task 1: Add Redis docker service and env vars

**Files:**
- Modify: `packages/db/docker-compose.yml`
- Modify: `packages/env/src/server.ts`
- Modify: `apps/server/.env`

**Step 1: Add Redis to docker-compose.yml**

Add a redis service to `packages/db/docker-compose.yml`:

```yaml
  redis:
    image: redis:7-alpine
    container_name: chatty-redis
    ports:
      - "6379:6379"
    volumes:
      - chatty_redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
```

And add the volume `chatty_redis_data:` under `volumes:`.

**Step 2: Add env vars to server env schema**

In `packages/env/src/server.ts`, add to the `server` object:

```typescript
REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
GOOGLE_CLIENT_ID: z.string().min(1),
GOOGLE_CLIENT_SECRET: z.string().min(1),
STRIPE_SECRET_KEY: z.string().min(1),
STRIPE_WEBHOOK_SECRET: z.string().min(1),
```

**Step 3: Add env vars to web env schema**

In `packages/env/src/web.ts`, add to the `client` object:

```typescript
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
```

And add to `runtimeEnv`:

```typescript
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
```

**Step 4: Update `.env` files**

In `apps/server/.env` add:

```
REDIS_URL=redis://localhost:6379
GOOGLE_CLIENT_ID=placeholder
GOOGLE_CLIENT_SECRET=placeholder
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
```

In `apps/web/.env` add:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
```

**Step 5: Start docker services and verify**

```bash
cd packages/db && docker compose up -d
```

Verify both postgres and redis are running.

**Step 6: Commit**

```bash
git add packages/db/docker-compose.yml packages/env/src/server.ts packages/env/src/web.ts apps/server/.env apps/web/.env
git commit -m "feat: add Redis docker service and new env vars for Google OAuth, Stripe, Redis"
```

---

### Task 2: Extend user schema with profile fields

**Files:**
- Modify: `packages/db/src/schema/auth.ts`

**Step 1: Add profile columns to user table**

In `packages/db/src/schema/auth.ts`, add a `genderEnum` and new columns to the `user` table:

```typescript
import { pgTable, text, timestamp, boolean, index, pgEnum } from "drizzle-orm/pg-core";

export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
```

Add these columns to the `user` table:

```typescript
gender: genderEnum("gender"),
country: text("country"),
onboarded: boolean("onboarded").default(false).notNull(),
isPremium: boolean("is_premium").default(false).notNull(),
stripeCustomerId: text("stripe_customer_id"),
isAnonymous: boolean("is_anonymous").default(true).notNull(),
```

**Step 2: Push schema to DB**

```bash
bun run db:push
```

**Step 3: Commit**

```bash
git add packages/db/src/schema/auth.ts
git commit -m "feat: extend user schema with gender, country, onboarded, premium fields"
```

---

### Task 3: Create new database schema tables

**Files:**
- Create: `packages/db/src/schema/chat.ts`
- Modify: `packages/db/src/schema/index.ts` (if exists, otherwise the main export)

**Step 1: Create chat schema file**

Create `packages/db/src/schema/chat.ts` with all new tables:

```typescript
import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
  pgEnum,
  jsonb,
  index,
  uniqueIndex,
  primaryKey,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth";

// Enums
export const friendshipStatusEnum = pgEnum("friendship_status", [
  "pending",
  "accepted",
  "rejected",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "friend_request",
  "friend_accepted",
  "group_invite",
]);

export const groupTypeEnum = pgEnum("group_type", ["public", "private"]);

export const groupRoleEnum = pgEnum("group_role", [
  "host",
  "admin",
  "member",
]);

// Tables
export const friendship = pgTable(
  "friendship",
  {
    id: uuid("id").primaryKey(),
    requesterId: text("requester_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    addresseeId: text("addressee_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: friendshipStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("friendship_requester_idx").on(table.requesterId),
    index("friendship_addressee_idx").on(table.addresseeId),
    uniqueIndex("friendship_pair_idx").on(
      table.requesterId,
      table.addresseeId
    ),
  ]
);

export const notification = pgTable(
  "notification",
  {
    id: uuid("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    data: jsonb("data").notNull(),
    read: boolean("read").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notification_user_read_idx").on(table.userId, table.read),
  ]
);

export const group = pgTable(
  "group",
  {
    id: uuid("id").primaryKey(),
    name: text("name").notNull(),
    type: groupTypeEnum("type").notNull(),
    inviteCode: text("invite_code"),
    hostId: text("host_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    maxMembers: integer("max_members").default(50).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("group_host_idx").on(table.hostId),
    uniqueIndex("group_invite_code_idx").on(table.inviteCode),
  ]
);

export const groupMember = pgTable(
  "group_member",
  {
    groupId: uuid("group_id")
      .notNull()
      .references(() => group.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: groupRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.groupId, table.userId] })]
);

export const message = pgTable(
  "message",
  {
    id: uuid("id").primaryKey(),
    content: text("content").notNull(),
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    groupId: uuid("group_id").references(() => group.id, {
      onDelete: "cascade",
    }),
    friendshipId: uuid("friendship_id").references(() => friendship.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("message_group_created_idx").on(table.groupId, table.createdAt),
    index("message_friendship_created_idx").on(
      table.friendshipId,
      table.createdAt
    ),
    check(
      "message_target_check",
      sql`(group_id IS NOT NULL AND friendship_id IS NULL) OR (group_id IS NULL AND friendship_id IS NOT NULL)`
    ),
  ]
);

// Relations
export const friendshipRelations = relations(friendship, ({ one }) => ({
  requester: one(user, {
    fields: [friendship.requesterId],
    references: [user.id],
    relationName: "friendshipRequester",
  }),
  addressee: one(user, {
    fields: [friendship.addresseeId],
    references: [user.id],
    relationName: "friendshipAddressee",
  }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
}));

export const groupRelations = relations(group, ({ one, many }) => ({
  host: one(user, {
    fields: [group.hostId],
    references: [user.id],
  }),
  members: many(groupMember),
  messages: many(message),
}));

export const groupMemberRelations = relations(groupMember, ({ one }) => ({
  group: one(group, {
    fields: [groupMember.groupId],
    references: [group.id],
  }),
  user: one(user, {
    fields: [groupMember.userId],
    references: [user.id],
  }),
}));

export const messageRelations = relations(message, ({ one }) => ({
  sender: one(user, {
    fields: [message.senderId],
    references: [user.id],
  }),
  group: one(group, {
    fields: [message.groupId],
    references: [group.id],
  }),
  friendship: one(friendship, {
    fields: [message.friendshipId],
    references: [friendship.id],
  }),
}));
```

**Step 2: Update the schema barrel export**

In `packages/db/src/schema/index.ts` (create if it doesn't exist):

```typescript
export * from "./auth";
export * from "./chat";
```

**Step 3: Update db client to import all schemas**

Ensure `packages/db/src/index.ts` imports from the barrel:

```typescript
import { env } from "@chat-application/env/server";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export const db = drizzle(env.DATABASE_URL, { schema });
```

**Step 4: Update user relations in auth.ts**

Add friendship and notification relations to the existing `userRelations` in `packages/db/src/schema/auth.ts`. Import the chat tables:

```typescript
import { friendship, notification, group, groupMember, message } from "./chat";
```

Update `userRelations`:

```typescript
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  sentFriendRequests: many(friendship, { relationName: "friendshipRequester" }),
  receivedFriendRequests: many(friendship, { relationName: "friendshipAddressee" }),
  notifications: many(notification),
  hostedGroups: many(group),
  groupMemberships: many(groupMember),
  messages: many(message),
}));
```

**Step 5: Update drizzle config to include new schema**

Ensure `packages/db/drizzle.config.ts` points to the schema directory:

```typescript
schema: "./src/schema",
```

This should already be correct.

**Step 6: Push schema**

```bash
bun run db:push
```

**Step 7: Commit**

```bash
git add packages/db/src/schema/
git commit -m "feat: add friendship, notification, group, group_member, message tables with UUID v7"
```

---

### Task 4: Create Redis client utility

**Files:**
- Create: `apps/server/src/lib/redis.ts`

**Step 1: Create Redis client**

```typescript
import { RedisClient } from "bun";
import { env } from "@chat-application/env/server";

export const redis = new RedisClient(env.REDIS_URL);

// Separate client for pub/sub subscriber (subscription takes over the connection)
export const createSubscriber = () => new RedisClient(env.REDIS_URL);
```

**Step 2: Commit**

```bash
git add apps/server/src/lib/redis.ts
git commit -m "feat: add Redis client using Bun built-in RedisClient"
```

---

## Phase 2: Auth Updates - Google OAuth, Stripe Plugin & Onboarding

### Task 5: Install dependencies for Stripe and TanStack Query

**Files:**
- Modify: `packages/auth/package.json` (add @better-auth/stripe, stripe)
- Modify: `apps/web/package.json` (add @tanstack/react-query)

**Step 1: Install packages**

```bash
cd packages/auth && bun add @better-auth/stripe stripe
cd ../../apps/web && bun add @tanstack/react-query @better-auth/stripe
```

**Step 2: Commit**

```bash
git add packages/auth/package.json apps/web/package.json bun.lock
git commit -m "feat: add Stripe and TanStack Query dependencies"
```

---

### Task 6: Configure Google OAuth + Stripe in Better Auth

**Files:**
- Modify: `packages/auth/src/index.ts`

**Step 1: Update auth config**

```typescript
import { db } from "@chat-application/db";
import * as schema from "@chat-application/db/schema/auth";
import { env } from "@chat-application/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";

const stripeClient = new Stripe(env.STRIPE_SECRET_KEY);

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  trustedOrigins: [env.CORS_ORIGIN],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
  },
  plugins: [
    stripe({
      stripeClient,
      stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: [
          {
            name: "premium",
            priceId: "price_premium_monthly", // Replace with real Stripe price ID
          },
        ],
      },
    }),
  ],
});

export type Auth = typeof auth;
```

**Step 2: Update auth client on frontend**

Modify `apps/web/src/lib/auth-client.ts`:

```typescript
import { env } from "@chat-application/env/web";
import { createAuthClient } from "better-auth/react";
import { stripeClient } from "@better-auth/stripe/client";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_SERVER_URL,
  plugins: [
    stripeClient({
      subscription: true,
    }),
  ],
});
```

**Step 3: Run Better Auth migration to add Stripe subscription table**

```bash
cd packages/auth && npx @better-auth/cli generate
```

Then push schema:

```bash
bun run db:push
```

**Step 4: Commit**

```bash
git add packages/auth/src/index.ts apps/web/src/lib/auth-client.ts
git commit -m "feat: configure Google OAuth and Stripe plugin in Better Auth"
```

---

### Task 7: Add TanStack Query provider

**Files:**
- Modify: `apps/web/src/components/providers.tsx`
- Create: `apps/web/src/lib/query-client.ts`

**Step 1: Create query client**

Create `apps/web/src/lib/query-client.ts`:

```typescript
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});
```

**Step 2: Update providers.tsx**

Add `QueryClientProvider` wrapping existing providers:

```typescript
"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./theme-provider";
import { TooltipProvider } from "./ui/tooltip";
import { Toaster } from "./ui/sonner";
import { queryClient } from "@/lib/query-client";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
```

**Step 3: Commit**

```bash
git add apps/web/src/lib/query-client.ts apps/web/src/components/providers.tsx
git commit -m "feat: add TanStack Query provider"
```

---

### Task 8: Create onboarding page

**Files:**
- Create: `apps/web/src/app/(base)/onboarding/page.tsx`
- Modify: `apps/web/src/app/(chat)/chat/layout.tsx` (redirect if not onboarded)

**Step 1: Create onboarding page**

Create `apps/web/src/app/(base)/onboarding/page.tsx`:

This page shows after first login. It asks for Gender (Male/Female/Other) and Country (text input with auto-detection attempt via IP). Uses TanStack Form + Zod for validation. On submit, calls `PATCH /api/user/onboard` and redirects to `/chat`.

```typescript
"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const onboardingSchema = z.object({
  gender: z.enum(["male", "female", "other"]),
  country: z.string().min(2, "Country is required"),
});

export default function OnboardingPage() {
  const router = useRouter();

  const form = useForm({
    defaultValues: { gender: "" as string, country: "" },
    onSubmit: async ({ value }) => {
      const parsed = onboardingSchema.safeParse(value);
      if (!parsed.success) {
        toast.error("Please fill in all fields");
        return;
      }
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/user/onboard`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(parsed.data),
        }
      );
      if (res.ok) {
        toast.success("Welcome aboard!");
        router.push("/chat");
      } else {
        toast.error("Something went wrong");
      }
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-8">
        <h1 className="text-2xl font-bold text-center">Complete Your Profile</h1>
        <p className="text-muted-foreground text-center">
          Tell us a bit about yourself to get started
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          {/* Gender selection */}
          <form.Field name="gender">
            {(field) => (
              <div className="space-y-2">
                <label className="text-sm font-medium">Gender</label>
                <div className="grid grid-cols-3 gap-2">
                  {["male", "female", "other"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => field.handleChange(g)}
                      className={`rounded-lg border p-3 text-sm capitalize transition-colors ${
                        field.state.value === g
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form.Field>

          {/* Country input */}
          <form.Field name="country">
            {(field) => (
              <div className="space-y-2">
                <label className="text-sm font-medium">Country</label>
                <input
                  type="text"
                  placeholder="e.g. United States"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            )}
          </form.Field>

          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
```

**Step 2: Update chat layout to check onboarding**

In `apps/web/src/app/(chat)/chat/layout.tsx`, after the auth check, also check if `user.onboarded === false` and redirect to `/onboarding`.

**Step 3: Update sign-in form with Google button**

In `apps/web/src/components/auth/sign-in-form.tsx`, add a Google sign-in button:

```typescript
import { authClient } from "@/lib/auth-client";

// Add this button above or below the email form
<Button
  type="button"
  variant="outline"
  className="w-full"
  onClick={() =>
    authClient.signIn.social({
      provider: "google",
      callbackURL: "/chat",
      newUserCallbackURL: "/onboarding",
    })
  }
>
  Continue with Google
</Button>
```

Do the same for `sign-up-form.tsx`.

**Step 4: Commit**

```bash
git add apps/web/src/app/(base)/onboarding/ apps/web/src/app/(chat)/chat/layout.tsx apps/web/src/components/auth/
git commit -m "feat: add onboarding page and Google OAuth sign-in button"
```

---

## Phase 3: Backend Module Structure & DI

### Task 9: Create the DI container and auth middleware

**Files:**
- Create: `apps/server/src/lib/container.ts`
- Create: `apps/server/src/lib/auth-middleware.ts`

**Step 1: Create auth middleware**

Create `apps/server/src/lib/auth-middleware.ts`:

```typescript
import { auth } from "@chat-application/auth";
import type { Context, Next } from "hono";

export async function authMiddleware(c: Context, next: Next) {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  c.set("user", session.user);
  c.set("session", session.session);
  return next();
}
```

**Step 2: Create DI container skeleton**

Create `apps/server/src/lib/container.ts`:

```typescript
import { db } from "@chat-application/db";
import { redis, createSubscriber } from "./redis";

// Repositories
import { UserRepository } from "../modules/user/user.repository";
import { FriendshipRepository } from "../modules/friendship/friendship.repository";
import { NotificationRepository } from "../modules/notification/notification.repository";
import { GroupRepository } from "../modules/group/group.repository";
import { ChatRepository } from "../modules/chat/chat.repository";

// Services
import { UserService } from "../modules/user/user.service";
import { FriendshipService } from "../modules/friendship/friendship.service";
import { NotificationService } from "../modules/notification/notification.service";
import { GroupService } from "../modules/group/group.service";
import { ChatService } from "../modules/chat/chat.service";
import { MatchmakingService } from "../modules/matchmaking/matchmaking.service";

// Controllers
import { UserController } from "../modules/user/user.controller";
import { FriendshipController } from "../modules/friendship/friendship.controller";
import { NotificationController } from "../modules/notification/notification.controller";
import { GroupController } from "../modules/group/group.controller";
import { ChatController } from "../modules/chat/chat.controller";
import { MatchmakingController } from "../modules/matchmaking/matchmaking.controller";

// Repositories
const userRepo = new UserRepository(db);
const friendshipRepo = new FriendshipRepository(db);
const notificationRepo = new NotificationRepository(db);
const groupRepo = new GroupRepository(db);
const chatRepo = new ChatRepository(db);

// Services
const userService = new UserService(userRepo);
const notificationService = new NotificationService(notificationRepo);
const friendshipService = new FriendshipService(friendshipRepo, notificationService);
const groupService = new GroupService(groupRepo);
const chatService = new ChatService(chatRepo);
const matchmakingService = new MatchmakingService(redis);

// Controllers
export const userController = new UserController(userService);
export const friendshipController = new FriendshipController(friendshipService);
export const notificationController = new NotificationController(notificationService);
export const groupController = new GroupController(groupService);
export const chatController = new ChatController(chatService);
export const matchmakingController = new MatchmakingController(matchmakingService);
```

NOTE: This file will cause import errors initially because the module files don't exist yet. Each subsequent task will create the modules and this file will compile only after all modules are created. Create this file as-is and it will be validated at the end of Phase 3.

**Step 3: Commit**

```bash
git add apps/server/src/lib/
git commit -m "feat: add auth middleware and DI container skeleton"
```

---

### Task 10: Create User module

**Files:**
- Create: `apps/server/src/modules/user/user.repository.ts`
- Create: `apps/server/src/modules/user/user.service.ts`
- Create: `apps/server/src/modules/user/user.controller.ts`
- Create: `apps/server/src/modules/user/user.routes.ts`

**Step 1: Create user repository**

```typescript
// user.repository.ts
import { eq } from "drizzle-orm";
import { user } from "@chat-application/db/schema/auth";
import type { db as DB } from "@chat-application/db";

type Database = typeof DB;

export class UserRepository {
  constructor(private db: Database) {}

  async findById(id: string) {
    return this.db.query.user.findFirst({
      where: eq(user.id, id),
    });
  }

  async updateProfile(
    id: string,
    data: { gender?: string; country?: string; onboarded?: boolean; isAnonymous?: boolean }
  ) {
    return this.db
      .update(user)
      .set(data)
      .where(eq(user.id, id))
      .returning();
  }
}
```

**Step 2: Create user service**

```typescript
// user.service.ts
import type { UserRepository } from "./user.repository";

export class UserService {
  constructor(private userRepo: UserRepository) {}

  async getProfile(userId: string) {
    return this.userRepo.findById(userId);
  }

  async onboard(userId: string, data: { gender: string; country: string }) {
    return this.userRepo.updateProfile(userId, {
      ...data,
      onboarded: true,
    });
  }

  async updateVisibility(userId: string, isAnonymous: boolean) {
    return this.userRepo.updateProfile(userId, { isAnonymous });
  }
}
```

**Step 3: Create user controller**

```typescript
// user.controller.ts
import type { Context } from "hono";
import type { UserService } from "./user.service";

export class UserController {
  constructor(private userService: UserService) {}

  getProfile = async (c: Context) => {
    const user = c.get("user");
    const profile = await this.userService.getProfile(user.id);
    if (!profile) return c.json({ error: "User not found" }, 404);
    return c.json(profile);
  };

  onboard = async (c: Context) => {
    const user = c.get("user");
    const body = await c.req.json<{ gender: string; country: string }>();
    const result = await this.userService.onboard(user.id, body);
    return c.json(result);
  };

  updateVisibility = async (c: Context) => {
    const user = c.get("user");
    const { isAnonymous } = await c.req.json<{ isAnonymous: boolean }>();
    const result = await this.userService.updateVisibility(user.id, isAnonymous);
    return c.json(result);
  };
}
```

**Step 4: Create user routes**

```typescript
// user.routes.ts
import { Hono } from "hono";
import { authMiddleware } from "../../lib/auth-middleware";
import type { UserController } from "./user.controller";

export function createUserRoutes(controller: UserController) {
  const router = new Hono();
  router.use("/*", authMiddleware);
  router.get("/profile", controller.getProfile);
  router.patch("/onboard", controller.onboard);
  router.patch("/visibility", controller.updateVisibility);
  return router;
}
```

**Step 5: Commit**

```bash
git add apps/server/src/modules/user/
git commit -m "feat: add User module (repository, service, controller, routes)"
```

---

### Task 11: Create Friendship module

**Files:**
- Create: `apps/server/src/modules/friendship/friendship.repository.ts`
- Create: `apps/server/src/modules/friendship/friendship.service.ts`
- Create: `apps/server/src/modules/friendship/friendship.controller.ts`
- Create: `apps/server/src/modules/friendship/friendship.routes.ts`

**Step 1: Create friendship repository**

```typescript
// friendship.repository.ts
import { eq, and, or, sql } from "drizzle-orm";
import { friendship } from "@chat-application/db/schema/chat";
import { user } from "@chat-application/db/schema/auth";
import type { db as DB } from "@chat-application/db";

type Database = typeof DB;

export class FriendshipRepository {
  constructor(private db: Database) {}

  async create(requesterId: string, addresseeId: string) {
    const id = Bun.randomUUIDv7();
    return this.db
      .insert(friendship)
      .values({ id, requesterId, addresseeId, status: "pending" })
      .returning();
  }

  async findById(id: string) {
    return this.db.query.friendship.findFirst({
      where: eq(friendship.id, id),
      with: { requester: true, addressee: true },
    });
  }

  async updateStatus(id: string, status: "accepted" | "rejected") {
    return this.db
      .update(friendship)
      .set({ status })
      .where(eq(friendship.id, id))
      .returning();
  }

  async findByUsers(userId1: string, userId2: string) {
    return this.db.query.friendship.findFirst({
      where: or(
        and(
          eq(friendship.requesterId, userId1),
          eq(friendship.addresseeId, userId2)
        ),
        and(
          eq(friendship.requesterId, userId2),
          eq(friendship.addresseeId, userId1)
        )
      ),
    });
  }

  async listFriends(userId: string) {
    return this.db.query.friendship.findMany({
      where: and(
        or(
          eq(friendship.requesterId, userId),
          eq(friendship.addresseeId, userId)
        ),
        eq(friendship.status, "accepted")
      ),
      with: { requester: true, addressee: true },
    });
  }

  async listPendingReceived(userId: string) {
    return this.db.query.friendship.findMany({
      where: and(
        eq(friendship.addresseeId, userId),
        eq(friendship.status, "pending")
      ),
      with: { requester: true },
    });
  }

  async delete(id: string) {
    return this.db
      .delete(friendship)
      .where(eq(friendship.id, id))
      .returning();
  }
}
```

**Step 2: Create friendship service**

```typescript
// friendship.service.ts
import type { FriendshipRepository } from "./friendship.repository";
import type { NotificationService } from "../notification/notification.service";

export class FriendshipService {
  constructor(
    private friendshipRepo: FriendshipRepository,
    private notificationService: NotificationService
  ) {}

  async sendRequest(requesterId: string, addresseeId: string) {
    if (requesterId === addresseeId) {
      throw new Error("Cannot send friend request to yourself");
    }

    const existing = await this.friendshipRepo.findByUsers(requesterId, addresseeId);
    if (existing) {
      throw new Error("Friend request already exists");
    }

    const [created] = await this.friendshipRepo.create(requesterId, addresseeId);

    await this.notificationService.create({
      userId: addresseeId,
      type: "friend_request",
      data: { friendshipId: created.id, fromUserId: requesterId },
    });

    return created;
  }

  async acceptRequest(friendshipId: string, userId: string) {
    const request = await this.friendshipRepo.findById(friendshipId);
    if (!request || request.addresseeId !== userId) {
      throw new Error("Friend request not found");
    }
    if (request.status !== "pending") {
      throw new Error("Friend request is not pending");
    }

    const [updated] = await this.friendshipRepo.updateStatus(friendshipId, "accepted");

    await this.notificationService.create({
      userId: request.requesterId,
      type: "friend_accepted",
      data: { friendshipId, fromUserId: userId },
    });

    return updated;
  }

  async rejectRequest(friendshipId: string, userId: string) {
    const request = await this.friendshipRepo.findById(friendshipId);
    if (!request || request.addresseeId !== userId) {
      throw new Error("Friend request not found");
    }
    return this.friendshipRepo.updateStatus(friendshipId, "rejected");
  }

  async removeFriend(friendshipId: string, userId: string) {
    const request = await this.friendshipRepo.findById(friendshipId);
    if (!request) throw new Error("Friendship not found");
    if (request.requesterId !== userId && request.addresseeId !== userId) {
      throw new Error("Not authorized");
    }
    return this.friendshipRepo.delete(friendshipId);
  }

  async listFriends(userId: string) {
    return this.friendshipRepo.listFriends(userId);
  }

  async listPendingRequests(userId: string) {
    return this.friendshipRepo.listPendingReceived(userId);
  }
}
```

**Step 3: Create friendship controller**

```typescript
// friendship.controller.ts
import type { Context } from "hono";
import type { FriendshipService } from "./friendship.service";

export class FriendshipController {
  constructor(private friendshipService: FriendshipService) {}

  sendRequest = async (c: Context) => {
    const user = c.get("user");
    const { addresseeId } = await c.req.json<{ addresseeId: string }>();
    try {
      const result = await this.friendshipService.sendRequest(user.id, addresseeId);
      return c.json(result, 201);
    } catch (e: any) {
      return c.json({ error: e.message }, 400);
    }
  };

  acceptRequest = async (c: Context) => {
    const user = c.get("user");
    const { id } = c.req.param();
    try {
      const result = await this.friendshipService.acceptRequest(id, user.id);
      return c.json(result);
    } catch (e: any) {
      return c.json({ error: e.message }, 400);
    }
  };

  rejectRequest = async (c: Context) => {
    const user = c.get("user");
    const { id } = c.req.param();
    try {
      const result = await this.friendshipService.rejectRequest(id, user.id);
      return c.json(result);
    } catch (e: any) {
      return c.json({ error: e.message }, 400);
    }
  };

  removeFriend = async (c: Context) => {
    const user = c.get("user");
    const { id } = c.req.param();
    try {
      await this.friendshipService.removeFriend(id, user.id);
      return c.json({ success: true });
    } catch (e: any) {
      return c.json({ error: e.message }, 400);
    }
  };

  listFriends = async (c: Context) => {
    const user = c.get("user");
    const friends = await this.friendshipService.listFriends(user.id);
    return c.json(friends);
  };

  listPending = async (c: Context) => {
    const user = c.get("user");
    const pending = await this.friendshipService.listPendingRequests(user.id);
    return c.json(pending);
  };
}
```

**Step 4: Create friendship routes**

```typescript
// friendship.routes.ts
import { Hono } from "hono";
import { authMiddleware } from "../../lib/auth-middleware";
import type { FriendshipController } from "./friendship.controller";

export function createFriendshipRoutes(controller: FriendshipController) {
  const router = new Hono();
  router.use("/*", authMiddleware);
  router.post("/request", controller.sendRequest);
  router.patch("/:id/accept", controller.acceptRequest);
  router.patch("/:id/reject", controller.rejectRequest);
  router.delete("/:id", controller.removeFriend);
  router.get("/", controller.listFriends);
  router.get("/pending", controller.listPending);
  return router;
}
```

**Step 5: Commit**

```bash
git add apps/server/src/modules/friendship/
git commit -m "feat: add Friendship module with friend request flow and notifications"
```

---

### Task 12: Create Notification module

**Files:**
- Create: `apps/server/src/modules/notification/notification.repository.ts`
- Create: `apps/server/src/modules/notification/notification.service.ts`
- Create: `apps/server/src/modules/notification/notification.controller.ts`
- Create: `apps/server/src/modules/notification/notification.routes.ts`

**Step 1: Create notification repository**

```typescript
// notification.repository.ts
import { eq, and, desc } from "drizzle-orm";
import { notification } from "@chat-application/db/schema/chat";
import type { db as DB } from "@chat-application/db";

type Database = typeof DB;

export class NotificationRepository {
  constructor(private db: Database) {}

  async create(data: {
    userId: string;
    type: "friend_request" | "friend_accepted" | "group_invite";
    data: Record<string, unknown>;
  }) {
    const id = Bun.randomUUIDv7();
    return this.db
      .insert(notification)
      .values({ id, ...data })
      .returning();
  }

  async listByUser(userId: string, limit = 50) {
    return this.db.query.notification.findMany({
      where: eq(notification.userId, userId),
      orderBy: [desc(notification.createdAt)],
      limit,
    });
  }

  async countUnread(userId: string) {
    const result = await this.db.query.notification.findMany({
      where: and(
        eq(notification.userId, userId),
        eq(notification.read, false)
      ),
    });
    return result.length;
  }

  async markAsRead(id: string, userId: string) {
    return this.db
      .update(notification)
      .set({ read: true })
      .where(and(eq(notification.id, id), eq(notification.userId, userId)))
      .returning();
  }

  async markAllAsRead(userId: string) {
    return this.db
      .update(notification)
      .set({ read: true })
      .where(and(eq(notification.userId, userId), eq(notification.read, false)))
      .returning();
  }
}
```

**Step 2: Create notification service**

```typescript
// notification.service.ts
import type { NotificationRepository } from "./notification.repository";

export class NotificationService {
  constructor(private notificationRepo: NotificationRepository) {}

  async create(data: {
    userId: string;
    type: "friend_request" | "friend_accepted" | "group_invite";
    data: Record<string, unknown>;
  }) {
    return this.notificationRepo.create(data);
  }

  async list(userId: string) {
    return this.notificationRepo.listByUser(userId);
  }

  async countUnread(userId: string) {
    return this.notificationRepo.countUnread(userId);
  }

  async markAsRead(id: string, userId: string) {
    return this.notificationRepo.markAsRead(id, userId);
  }

  async markAllAsRead(userId: string) {
    return this.notificationRepo.markAllAsRead(userId);
  }
}
```

**Step 3: Create notification controller**

```typescript
// notification.controller.ts
import type { Context } from "hono";
import type { NotificationService } from "./notification.service";

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  list = async (c: Context) => {
    const user = c.get("user");
    const notifications = await this.notificationService.list(user.id);
    return c.json(notifications);
  };

  countUnread = async (c: Context) => {
    const user = c.get("user");
    const count = await this.notificationService.countUnread(user.id);
    return c.json({ count });
  };

  markAsRead = async (c: Context) => {
    const user = c.get("user");
    const { id } = c.req.param();
    const result = await this.notificationService.markAsRead(id, user.id);
    return c.json(result);
  };

  markAllAsRead = async (c: Context) => {
    const user = c.get("user");
    await this.notificationService.markAllAsRead(user.id);
    return c.json({ success: true });
  };
}
```

**Step 4: Create notification routes**

```typescript
// notification.routes.ts
import { Hono } from "hono";
import { authMiddleware } from "../../lib/auth-middleware";
import type { NotificationController } from "./notification.controller";

export function createNotificationRoutes(controller: NotificationController) {
  const router = new Hono();
  router.use("/*", authMiddleware);
  router.get("/", controller.list);
  router.get("/unread-count", controller.countUnread);
  router.patch("/:id/read", controller.markAsRead);
  router.patch("/read-all", controller.markAllAsRead);
  return router;
}
```

**Step 5: Commit**

```bash
git add apps/server/src/modules/notification/
git commit -m "feat: add Notification module with CRUD and unread count"
```

---

### Task 13: Create Group module

**Files:**
- Create: `apps/server/src/modules/group/group.repository.ts`
- Create: `apps/server/src/modules/group/group.service.ts`
- Create: `apps/server/src/modules/group/group.controller.ts`
- Create: `apps/server/src/modules/group/group.routes.ts`

**Step 1: Create group repository**

```typescript
// group.repository.ts
import { eq, and, sql } from "drizzle-orm";
import { group, groupMember } from "@chat-application/db/schema/chat";
import type { db as DB } from "@chat-application/db";

type Database = typeof DB;

export class GroupRepository {
  constructor(private db: Database) {}

  async create(data: {
    name: string;
    type: "public" | "private";
    hostId: string;
    maxMembers?: number;
  }) {
    const id = Bun.randomUUIDv7();
    const inviteCode =
      data.type === "private"
        ? Math.random().toString(36).substring(2, 10).toUpperCase()
        : null;

    const [created] = await this.db
      .insert(group)
      .values({ id, ...data, inviteCode })
      .returning();

    // Add host as member with host role
    await this.db.insert(groupMember).values({
      groupId: id,
      userId: data.hostId,
      role: "host",
    });

    return created;
  }

  async findById(id: string) {
    return this.db.query.group.findFirst({
      where: eq(group.id, id),
      with: { members: { with: { user: true } }, host: true },
    });
  }

  async findByInviteCode(code: string) {
    return this.db.query.group.findFirst({
      where: eq(group.inviteCode, code),
    });
  }

  async listPublic() {
    return this.db.query.group.findMany({
      where: eq(group.type, "public"),
      with: { host: true },
    });
  }

  async listUserGroups(userId: string) {
    return this.db.query.groupMember.findMany({
      where: eq(groupMember.userId, userId),
      with: { group: { with: { host: true } } },
    });
  }

  async addMember(groupId: string, userId: string, role: "admin" | "member" = "member") {
    return this.db
      .insert(groupMember)
      .values({ groupId, userId, role })
      .returning();
  }

  async removeMember(groupId: string, userId: string) {
    return this.db
      .delete(groupMember)
      .where(
        and(eq(groupMember.groupId, groupId), eq(groupMember.userId, userId))
      )
      .returning();
  }

  async getMember(groupId: string, userId: string) {
    return this.db.query.groupMember.findFirst({
      where: and(
        eq(groupMember.groupId, groupId),
        eq(groupMember.userId, userId)
      ),
    });
  }

  async getMemberCount(groupId: string) {
    const members = await this.db.query.groupMember.findMany({
      where: eq(groupMember.groupId, groupId),
    });
    return members.length;
  }

  async delete(id: string) {
    return this.db.delete(group).where(eq(group.id, id)).returning();
  }

  async regenerateInviteCode(id: string) {
    const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    return this.db
      .update(group)
      .set({ inviteCode: newCode })
      .where(eq(group.id, id))
      .returning();
  }
}
```

**Step 2: Create group service**

```typescript
// group.service.ts
import type { GroupRepository } from "./group.repository";

export class GroupService {
  constructor(private groupRepo: GroupRepository) {}

  async create(data: {
    name: string;
    type: "public" | "private";
    hostId: string;
    maxMembers?: number;
  }) {
    return this.groupRepo.create(data);
  }

  async getById(id: string) {
    return this.groupRepo.findById(id);
  }

  async listPublic() {
    return this.groupRepo.listPublic();
  }

  async listUserGroups(userId: string) {
    return this.groupRepo.listUserGroups(userId);
  }

  async joinPublic(groupId: string, userId: string) {
    const grp = await this.groupRepo.findById(groupId);
    if (!grp) throw new Error("Group not found");
    if (grp.type !== "public") throw new Error("Group is not public");

    const existing = await this.groupRepo.getMember(groupId, userId);
    if (existing) throw new Error("Already a member");

    const count = await this.groupRepo.getMemberCount(groupId);
    if (count >= grp.maxMembers) throw new Error("Group is full");

    return this.groupRepo.addMember(groupId, userId);
  }

  async joinByCode(code: string, userId: string) {
    const grp = await this.groupRepo.findByInviteCode(code);
    if (!grp) throw new Error("Invalid invite code");

    const existing = await this.groupRepo.getMember(grp.id, userId);
    if (existing) throw new Error("Already a member");

    const count = await this.groupRepo.getMemberCount(grp.id);
    if (count >= grp.maxMembers) throw new Error("Group is full");

    return this.groupRepo.addMember(grp.id, userId);
  }

  async leave(groupId: string, userId: string) {
    const member = await this.groupRepo.getMember(groupId, userId);
    if (!member) throw new Error("Not a member");
    if (member.role === "host") throw new Error("Host cannot leave, delete the group instead");
    return this.groupRepo.removeMember(groupId, userId);
  }

  async kick(groupId: string, targetUserId: string, requesterId: string) {
    const requester = await this.groupRepo.getMember(groupId, requesterId);
    if (!requester || (requester.role !== "host" && requester.role !== "admin")) {
      throw new Error("Not authorized");
    }

    const target = await this.groupRepo.getMember(groupId, targetUserId);
    if (!target) throw new Error("User is not a member");
    if (target.role === "host") throw new Error("Cannot kick the host");

    return this.groupRepo.removeMember(groupId, targetUserId);
  }

  async deleteGroup(groupId: string, userId: string) {
    const grp = await this.groupRepo.findById(groupId);
    if (!grp || grp.hostId !== userId) throw new Error("Not authorized");
    return this.groupRepo.delete(groupId);
  }

  async regenerateInviteCode(groupId: string, userId: string) {
    const grp = await this.groupRepo.findById(groupId);
    if (!grp || grp.hostId !== userId) throw new Error("Not authorized");
    if (grp.type !== "private") throw new Error("Only private groups have invite codes");
    return this.groupRepo.regenerateInviteCode(groupId);
  }
}
```

**Step 3: Create group controller**

```typescript
// group.controller.ts
import type { Context } from "hono";
import type { GroupService } from "./group.service";

export class GroupController {
  constructor(private groupService: GroupService) {}

  create = async (c: Context) => {
    const user = c.get("user");
    const body = await c.req.json<{
      name: string;
      type: "public" | "private";
      maxMembers?: number;
    }>();
    const result = await this.groupService.create({
      ...body,
      hostId: user.id,
    });
    return c.json(result, 201);
  };

  getById = async (c: Context) => {
    const { id } = c.req.param();
    const result = await this.groupService.getById(id);
    if (!result) return c.json({ error: "Group not found" }, 404);
    return c.json(result);
  };

  listPublic = async (c: Context) => {
    const result = await this.groupService.listPublic();
    return c.json(result);
  };

  listMyGroups = async (c: Context) => {
    const user = c.get("user");
    const result = await this.groupService.listUserGroups(user.id);
    return c.json(result);
  };

  joinPublic = async (c: Context) => {
    const user = c.get("user");
    const { id } = c.req.param();
    try {
      const result = await this.groupService.joinPublic(id, user.id);
      return c.json(result);
    } catch (e: any) {
      return c.json({ error: e.message }, 400);
    }
  };

  joinByCode = async (c: Context) => {
    const user = c.get("user");
    const { code } = await c.req.json<{ code: string }>();
    try {
      const result = await this.groupService.joinByCode(code, user.id);
      return c.json(result);
    } catch (e: any) {
      return c.json({ error: e.message }, 400);
    }
  };

  leave = async (c: Context) => {
    const user = c.get("user");
    const { id } = c.req.param();
    try {
      await this.groupService.leave(id, user.id);
      return c.json({ success: true });
    } catch (e: any) {
      return c.json({ error: e.message }, 400);
    }
  };

  kick = async (c: Context) => {
    const user = c.get("user");
    const { id } = c.req.param();
    const { userId } = await c.req.json<{ userId: string }>();
    try {
      await this.groupService.kick(id, userId, user.id);
      return c.json({ success: true });
    } catch (e: any) {
      return c.json({ error: e.message }, 400);
    }
  };

  deleteGroup = async (c: Context) => {
    const user = c.get("user");
    const { id } = c.req.param();
    try {
      await this.groupService.deleteGroup(id, user.id);
      return c.json({ success: true });
    } catch (e: any) {
      return c.json({ error: e.message }, 400);
    }
  };

  regenerateCode = async (c: Context) => {
    const user = c.get("user");
    const { id } = c.req.param();
    try {
      const result = await this.groupService.regenerateInviteCode(id, user.id);
      return c.json(result);
    } catch (e: any) {
      return c.json({ error: e.message }, 400);
    }
  };
}
```

**Step 4: Create group routes**

```typescript
// group.routes.ts
import { Hono } from "hono";
import { authMiddleware } from "../../lib/auth-middleware";
import type { GroupController } from "./group.controller";

export function createGroupRoutes(controller: GroupController) {
  const router = new Hono();
  router.use("/*", authMiddleware);
  router.post("/", controller.create);
  router.get("/public", controller.listPublic);
  router.get("/mine", controller.listMyGroups);
  router.get("/:id", controller.getById);
  router.post("/:id/join", controller.joinPublic);
  router.post("/join-code", controller.joinByCode);
  router.post("/:id/leave", controller.leave);
  router.post("/:id/kick", controller.kick);
  router.delete("/:id", controller.deleteGroup);
  router.post("/:id/regenerate-code", controller.regenerateCode);
  return router;
}
```

**Step 5: Commit**

```bash
git add apps/server/src/modules/group/
git commit -m "feat: add Group module with public/private groups, join by code, member management"
```

---

### Task 14: Create Chat module (for persistent messages)

**Files:**
- Create: `apps/server/src/modules/chat/chat.repository.ts`
- Create: `apps/server/src/modules/chat/chat.service.ts`
- Create: `apps/server/src/modules/chat/chat.controller.ts`
- Create: `apps/server/src/modules/chat/chat.routes.ts`

**Step 1: Create chat repository**

```typescript
// chat.repository.ts
import { eq, and, desc, lt } from "drizzle-orm";
import { message } from "@chat-application/db/schema/chat";
import type { db as DB } from "@chat-application/db";

type Database = typeof DB;

export class ChatRepository {
  constructor(private db: Database) {}

  async createMessage(data: {
    content: string;
    senderId: string;
    groupId?: string;
    friendshipId?: string;
  }) {
    const id = Bun.randomUUIDv7();
    return this.db
      .insert(message)
      .values({ id, ...data })
      .returning();
  }

  async getGroupMessages(groupId: string, limit = 50, before?: string) {
    return this.db.query.message.findMany({
      where: before
        ? and(eq(message.groupId, groupId), lt(message.id, before))
        : eq(message.groupId, groupId),
      orderBy: [desc(message.createdAt)],
      limit,
      with: { sender: true },
    });
  }

  async getFriendMessages(friendshipId: string, limit = 50, before?: string) {
    return this.db.query.message.findMany({
      where: before
        ? and(eq(message.friendshipId, friendshipId), lt(message.id, before))
        : eq(message.friendshipId, friendshipId),
      orderBy: [desc(message.createdAt)],
      limit,
      with: { sender: true },
    });
  }
}
```

**Step 2: Create chat service**

```typescript
// chat.service.ts
import type { ChatRepository } from "./chat.repository";

export class ChatService {
  constructor(private chatRepo: ChatRepository) {}

  async saveGroupMessage(data: {
    content: string;
    senderId: string;
    groupId: string;
  }) {
    return this.chatRepo.createMessage(data);
  }

  async saveFriendMessage(data: {
    content: string;
    senderId: string;
    friendshipId: string;
  }) {
    return this.chatRepo.createMessage(data);
  }

  async getGroupMessages(groupId: string, limit?: number, before?: string) {
    return this.chatRepo.getGroupMessages(groupId, limit, before);
  }

  async getFriendMessages(friendshipId: string, limit?: number, before?: string) {
    return this.chatRepo.getFriendMessages(friendshipId, limit, before);
  }
}
```

**Step 3: Create chat controller**

```typescript
// chat.controller.ts
import type { Context } from "hono";
import type { ChatService } from "./chat.service";

export class ChatController {
  constructor(private chatService: ChatService) {}

  getGroupMessages = async (c: Context) => {
    const { groupId } = c.req.param();
    const { limit, before } = c.req.query();
    const messages = await this.chatService.getGroupMessages(
      groupId,
      limit ? Number(limit) : undefined,
      before || undefined
    );
    return c.json(messages);
  };

  getFriendMessages = async (c: Context) => {
    const { friendshipId } = c.req.param();
    const { limit, before } = c.req.query();
    const messages = await this.chatService.getFriendMessages(
      friendshipId,
      limit ? Number(limit) : undefined,
      before || undefined
    );
    return c.json(messages);
  };
}
```

**Step 4: Create chat routes**

```typescript
// chat.routes.ts
import { Hono } from "hono";
import { authMiddleware } from "../../lib/auth-middleware";
import type { ChatController } from "./chat.controller";

export function createChatRoutes(controller: ChatController) {
  const router = new Hono();
  router.use("/*", authMiddleware);
  router.get("/groups/:groupId/messages", controller.getGroupMessages);
  router.get("/friends/:friendshipId/messages", controller.getFriendMessages);
  return router;
}
```

**Step 5: Commit**

```bash
git add apps/server/src/modules/chat/
git commit -m "feat: add Chat module for persistent message storage and retrieval"
```

---

### Task 15: Create Matchmaking module

**Files:**
- Create: `apps/server/src/modules/matchmaking/matchmaking.service.ts`
- Create: `apps/server/src/modules/matchmaking/matchmaking.controller.ts`

**Step 1: Create matchmaking service**

```typescript
// matchmaking.service.ts
import type { RedisClient } from "bun";

const ANONYMOUS_ADJECTIVES = [
  "Brave", "Calm", "Clever", "Bold", "Swift", "Wise", "Kind", "Bright",
  "Gentle", "Fierce", "Noble", "Witty", "Keen", "Daring", "Lucky",
];

const ANONYMOUS_ANIMALS = [
  "Fox", "Owl", "Bear", "Wolf", "Hawk", "Deer", "Lynx", "Otter",
  "Raven", "Tiger", "Eagle", "Panda", "Koala", "Falcon", "Dolphin",
];

function generateAnonymousName(): string {
  const adj = ANONYMOUS_ADJECTIVES[Math.floor(Math.random() * ANONYMOUS_ADJECTIVES.length)];
  const animal = ANONYMOUS_ANIMALS[Math.floor(Math.random() * ANONYMOUS_ANIMALS.length)];
  return `${adj} ${animal}`;
}

export interface QueueEntry {
  userId: string;
  gender?: string;
  isPremium: boolean;
  timestamp: number;
}

export class MatchmakingService {
  private readonly QUEUE_PREFIX = "matchmaking:queue:";
  private readonly TIMEOUT_MS = 60_000;

  constructor(private redis: RedisClient) {}

  async joinQueue(entry: QueueEntry, genderPreference?: string): Promise<string> {
    const queueKey = genderPreference
      ? `${this.QUEUE_PREFIX}${genderPreference}`
      : `${this.QUEUE_PREFIX}random`;

    await this.redis.send("LPUSH", [queueKey, JSON.stringify(entry)]);
    return queueKey;
  }

  async leaveQueue(userId: string, queueKey: string): Promise<void> {
    // Get all entries and remove the one matching userId
    const entries = await this.redis.send("LRANGE", [queueKey, "0", "-1"]);
    if (Array.isArray(entries)) {
      for (const entry of entries) {
        const parsed = JSON.parse(entry as string) as QueueEntry;
        if (parsed.userId === userId) {
          await this.redis.send("LREM", [queueKey, "1", entry as string]);
          break;
        }
      }
    }
  }

  async findMatch(queueKey: string, currentUserId: string): Promise<QueueEntry | null> {
    const raw = await this.redis.send("RPOP", [queueKey]);
    if (!raw) return null;

    const entry = JSON.parse(raw as string) as QueueEntry;

    // Don't match with yourself
    if (entry.userId === currentUserId) {
      // Put them back and return null
      await this.redis.send("RPUSH", [queueKey, raw as string]);
      return null;
    }

    // Check if entry is stale (older than timeout)
    if (Date.now() - entry.timestamp > this.TIMEOUT_MS) {
      return null; // Discard stale entry
    }

    return entry;
  }

  generateRoomId(): string {
    return `room:${Bun.randomUUIDv7()}`;
  }

  generateAnonymousName(): string {
    return generateAnonymousName();
  }

  async setActiveRoom(roomId: string, user1Id: string, user2Id: string): Promise<void> {
    await this.redis.set(roomId, JSON.stringify({ user1Id, user2Id }));
    // Auto-expire room data after 2 hours
    await this.redis.send("EXPIRE", [roomId, "7200"]);
  }

  async getActiveRoom(roomId: string): Promise<{ user1Id: string; user2Id: string } | null> {
    const raw = await this.redis.get(roomId);
    if (!raw) return null;
    return JSON.parse(raw);
  }

  async removeActiveRoom(roomId: string): Promise<void> {
    await this.redis.send("DEL", [roomId]);
  }
}
```

**Step 2: Create matchmaking controller (WebSocket event handler, not HTTP)**

```typescript
// matchmaking.controller.ts
import type { MatchmakingService, QueueEntry } from "./matchmaking.service";

export class MatchmakingController {
  constructor(private matchmakingService: MatchmakingService) {}

  // These methods are called by the WebSocket handler, not HTTP routes
  async handleJoinQueue(
    userId: string,
    gender: string | undefined,
    isPremium: boolean,
    genderPreference?: string
  ): Promise<{ queueKey: string }> {
    // Validate premium for gender preference
    if (genderPreference && !isPremium) {
      throw new Error("Gender preference matching requires premium");
    }

    const entry: QueueEntry = {
      userId,
      gender,
      isPremium,
      timestamp: Date.now(),
    };

    const queueKey = await this.matchmakingService.joinQueue(entry, genderPreference);
    return { queueKey };
  }

  async handleFindMatch(
    queueKey: string,
    currentUserId: string
  ): Promise<{
    matched: boolean;
    roomId?: string;
    matchedUserId?: string;
    anonymousName1?: string;
    anonymousName2?: string;
  }> {
    const match = await this.matchmakingService.findMatch(queueKey, currentUserId);
    if (!match) {
      return { matched: false };
    }

    const roomId = this.matchmakingService.generateRoomId();
    const name1 = this.matchmakingService.generateAnonymousName();
    const name2 = this.matchmakingService.generateAnonymousName();

    await this.matchmakingService.setActiveRoom(roomId, currentUserId, match.userId);

    return {
      matched: true,
      roomId,
      matchedUserId: match.userId,
      anonymousName1: name1,
      anonymousName2: name2,
    };
  }

  async handleLeaveQueue(userId: string, queueKey: string): Promise<void> {
    await this.matchmakingService.leaveQueue(userId, queueKey);
  }

  async handleEndChat(roomId: string): Promise<{ user1Id: string; user2Id: string } | null> {
    const room = await this.matchmakingService.getActiveRoom(roomId);
    if (room) {
      await this.matchmakingService.removeActiveRoom(roomId);
    }
    return room;
  }
}
```

**Step 3: Commit**

```bash
git add apps/server/src/modules/matchmaking/
git commit -m "feat: add Matchmaking module with Redis queue and anonymous name generation"
```

---

## Phase 4: WebSocket Infrastructure

### Task 16: Create WebSocket connection manager and handler

**Files:**
- Create: `apps/server/src/ws/connection-manager.ts`
- Create: `apps/server/src/ws/message-handler.ts`
- Create: `apps/server/src/ws/index.ts`
- Modify: `apps/server/src/index.ts`

**Step 1: Create connection manager**

```typescript
// ws/connection-manager.ts
import type { ServerWebSocket } from "bun";

export interface WsUserData {
  userId: string;
  gender?: string;
  isPremium: boolean;
}

class ConnectionManager {
  private connections = new Map<string, ServerWebSocket<WsUserData>>();

  add(userId: string, ws: ServerWebSocket<WsUserData>) {
    this.connections.set(userId, ws);
  }

  remove(userId: string) {
    this.connections.delete(userId);
  }

  get(userId: string) {
    return this.connections.get(userId);
  }

  isOnline(userId: string) {
    return this.connections.has(userId);
  }

  sendTo(userId: string, message: object) {
    const ws = this.connections.get(userId);
    if (ws) {
      ws.send(JSON.stringify(message));
    }
  }

  broadcast(userIds: string[], message: object) {
    const json = JSON.stringify(message);
    for (const userId of userIds) {
      const ws = this.connections.get(userId);
      if (ws) ws.send(json);
    }
  }
}

export const connectionManager = new ConnectionManager();
```

**Step 2: Create message handler**

```typescript
// ws/message-handler.ts
import { connectionManager, type WsUserData } from "./connection-manager";
import {
  matchmakingController,
  chatController,
  groupController,
  friendshipController,
  notificationController,
} from "../lib/container";
import { redis, createSubscriber } from "../lib/redis";
import type { ServerWebSocket } from "bun";

// Track user state
const userQueueKeys = new Map<string, string>();
const userRooms = new Map<string, string>(); // userId -> roomId
const userAnonymousNames = new Map<string, Map<string, string>>(); // roomId -> userId -> name

interface WsMessage {
  type: string;
  data?: any;
}

export async function handleWsMessage(
  ws: ServerWebSocket<WsUserData>,
  raw: string
) {
  const { userId, gender, isPremium } = ws.data;

  let msg: WsMessage;
  try {
    msg = JSON.parse(raw);
  } catch {
    ws.send(JSON.stringify({ type: "error", data: { message: "Invalid JSON" } }));
    return;
  }

  switch (msg.type) {
    // ==================== MATCHMAKING ====================
    case "matchmaking:join": {
      try {
        const { queueKey } = await matchmakingController.handleJoinQueue(
          userId,
          gender,
          isPremium,
          msg.data?.genderPreference
        );
        userQueueKeys.set(userId, queueKey);

        // Try to find a match immediately
        const result = await matchmakingController.handleFindMatch(queueKey, userId);
        if (result.matched && result.roomId && result.matchedUserId) {
          // Store room info
          userRooms.set(userId, result.roomId);
          userRooms.set(result.matchedUserId, result.roomId);

          // Store anonymous names
          const nameMap = new Map<string, string>();
          nameMap.set(userId, result.anonymousName1!);
          nameMap.set(result.matchedUserId, result.anonymousName2!);
          userAnonymousNames.set(result.roomId, nameMap);

          // Notify both users
          connectionManager.sendTo(userId, {
            type: "matchmaking:matched",
            data: {
              roomId: result.roomId,
              anonymousName: result.anonymousName1,
              partnerName: result.anonymousName2,
            },
          });
          connectionManager.sendTo(result.matchedUserId, {
            type: "matchmaking:matched",
            data: {
              roomId: result.roomId,
              anonymousName: result.anonymousName2,
              partnerName: result.anonymousName1,
            },
          });

          // Clean up queue entries
          userQueueKeys.delete(userId);
          userQueueKeys.delete(result.matchedUserId);
        }
        // If no match found, user stays in queue. A polling loop or
        // the next user joining will trigger matching.
      } catch (e: any) {
        ws.send(
          JSON.stringify({ type: "error", data: { message: e.message } })
        );
      }
      break;
    }

    case "matchmaking:cancel": {
      const queueKey = userQueueKeys.get(userId);
      if (queueKey) {
        await matchmakingController.handleLeaveQueue(userId, queueKey);
        userQueueKeys.delete(userId);
      }
      break;
    }

    // ==================== ANONYMOUS CHAT ====================
    case "chat:message": {
      const { roomId, content } = msg.data;
      const room = await matchmakingController.handleEndChat(roomId);
      // Actually DON'T end chat here - we just want to relay the message
      // Get the partner
      const names = userAnonymousNames.get(roomId);
      const senderName = names?.get(userId) || "Anonymous";

      // Find partner by checking room data from Redis
      const roomData = JSON.parse(
        (await redis.get(roomId)) || "{}"
      );
      const partnerId =
        roomData.user1Id === userId ? roomData.user2Id : roomData.user1Id;

      if (partnerId) {
        connectionManager.sendTo(partnerId, {
          type: "chat:message",
          data: {
            roomId,
            content,
            senderName,
            timestamp: new Date().toISOString(),
          },
        });
      }
      break;
    }

    case "chat:end": {
      const { roomId } = msg.data;
      const room = await matchmakingController.handleEndChat(roomId);
      if (room) {
        // Notify both users
        connectionManager.sendTo(room.user1Id, {
          type: "chat:ended",
          data: { roomId, canAddFriend: true, partnerId: room.user2Id },
        });
        connectionManager.sendTo(room.user2Id, {
          type: "chat:ended",
          data: { roomId, canAddFriend: true, partnerId: room.user1Id },
        });

        // Clean up
        userRooms.delete(room.user1Id);
        userRooms.delete(room.user2Id);
        userAnonymousNames.delete(roomId);
      }
      break;
    }

    case "chat:typing": {
      const { roomId, isTyping } = msg.data;
      const rawRoom = await redis.get(roomId);
      if (rawRoom) {
        const roomData = JSON.parse(rawRoom);
        const partnerId =
          roomData.user1Id === userId ? roomData.user2Id : roomData.user1Id;
        connectionManager.sendTo(partnerId, {
          type: "chat:typing",
          data: { roomId, isTyping },
        });
      }
      break;
    }

    // ==================== GROUP CHAT ====================
    case "group:message": {
      const { groupId, content } = msg.data;
      // Save to DB (persistent)
      const [saved] = await chatController.chatService.saveGroupMessage({
        content,
        senderId: userId,
        groupId,
      });

      // Get group members and broadcast
      const grp = await groupController.groupService.getById(groupId);
      if (grp) {
        const memberIds = grp.members
          .map((m: any) => m.userId)
          .filter((id: string) => id !== userId);

        connectionManager.broadcast(memberIds, {
          type: "group:message",
          data: {
            groupId,
            content,
            senderId: userId,
            senderName: grp.members.find((m: any) => m.userId === userId)?.user
              ?.name || "Unknown",
            messageId: saved.id,
            timestamp: saved.createdAt,
          },
        });
      }
      break;
    }

    case "group:typing": {
      const { groupId, isTyping } = msg.data;
      const grp = await groupController.groupService.getById(groupId);
      if (grp) {
        const memberIds = grp.members
          .map((m: any) => m.userId)
          .filter((id: string) => id !== userId);

        connectionManager.broadcast(memberIds, {
          type: "group:typing",
          data: { groupId, userId, isTyping },
        });
      }
      break;
    }

    // ==================== FRIEND DM ====================
    case "friend:message": {
      const { friendshipId, content } = msg.data;
      // Save to DB (persistent)
      const [saved] = await chatController.chatService.saveFriendMessage({
        content,
        senderId: userId,
        friendshipId,
      });

      // Find the friend
      const friendship = await friendshipController.friendshipService.friendshipRepo.findById(friendshipId);
      if (friendship) {
        const friendId =
          friendship.requesterId === userId
            ? friendship.addresseeId
            : friendship.requesterId;

        connectionManager.sendTo(friendId, {
          type: "friend:message",
          data: {
            friendshipId,
            content,
            senderId: userId,
            messageId: saved.id,
            timestamp: saved.createdAt,
          },
        });
      }
      break;
    }

    case "friend:typing": {
      const { friendshipId, isTyping } = msg.data;
      const friendship = await friendshipController.friendshipService.friendshipRepo.findById(friendshipId);
      if (friendship) {
        const friendId =
          friendship.requesterId === userId
            ? friendship.addresseeId
            : friendship.requesterId;

        connectionManager.sendTo(friendId, {
          type: "friend:typing",
          data: { friendshipId, isTyping },
        });
      }
      break;
    }

    default:
      ws.send(
        JSON.stringify({
          type: "error",
          data: { message: `Unknown message type: ${msg.type}` },
        })
      );
  }
}

export function handleWsClose(userId: string) {
  // Remove from connection manager
  connectionManager.remove(userId);

  // Remove from matchmaking queue if in one
  const queueKey = userQueueKeys.get(userId);
  if (queueKey) {
    matchmakingController.handleLeaveQueue(userId, queueKey);
    userQueueKeys.delete(userId);
  }

  // If in an active room, end the chat
  const roomId = userRooms.get(userId);
  if (roomId) {
    matchmakingController.handleEndChat(roomId).then((room) => {
      if (room) {
        const partnerId =
          room.user1Id === userId ? room.user2Id : room.user1Id;
        connectionManager.sendTo(partnerId, {
          type: "chat:ended",
          data: { roomId, canAddFriend: true, partnerId: userId },
        });
        userRooms.delete(room.user1Id);
        userRooms.delete(room.user2Id);
        userAnonymousNames.delete(roomId);
      }
    });
  }
}
```

NOTE: The direct access to `chatController.chatService` and `friendshipController.friendshipService` is intentional for the WS handler -- these are wired through the DI container. In production, you may want to pass services directly. This can be refactored later.

**Step 3: Create WebSocket index (upgrade handler)**

```typescript
// ws/index.ts
import { auth } from "@chat-application/auth";
import { connectionManager, type WsUserData } from "./connection-manager";
import { handleWsMessage, handleWsClose } from "./message-handler";
import { upgradeWebSocket, websocket } from "hono/bun";

export { websocket };

export const wsRoute = upgradeWebSocket(async (c) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    return {
      onOpen(_event, ws) {
        ws.close(1008, "Unauthorized");
      },
    };
  }

  const userData: WsUserData = {
    userId: session.user.id,
    gender: (session.user as any).gender,
    isPremium: (session.user as any).isPremium ?? false,
  };

  return {
    onOpen(_event, ws) {
      connectionManager.add(userData.userId, ws as any);
    },
    onMessage(event, ws) {
      handleWsMessage(ws as any, event.data as string);
    },
    onClose() {
      handleWsClose(userData.userId);
    },
  };
});
```

**Step 4: Update server index.ts**

Update `apps/server/src/index.ts` to mount all routes and the WebSocket endpoint:

```typescript
import { auth } from "@chat-application/auth";
import { env } from "@chat-application/env/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import { wsRoute, websocket } from "./ws";
import {
  userController,
  friendshipController,
  notificationController,
  groupController,
  chatController,
} from "./lib/container";
import { createUserRoutes } from "./modules/user/user.routes";
import { createFriendshipRoutes } from "./modules/friendship/friendship.routes";
import { createNotificationRoutes } from "./modules/notification/notification.routes";
import { createGroupRoutes } from "./modules/group/group.routes";
import { createChatRoutes } from "./modules/chat/chat.routes";

const app = new Hono();

// Middleware
app.use(logger());
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// Auth routes (Better Auth handler)
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// API routes
app.route("/api/user", createUserRoutes(userController));
app.route("/api/friends", createFriendshipRoutes(friendshipController));
app.route("/api/notifications", createNotificationRoutes(notificationController));
app.route("/api/groups", createGroupRoutes(groupController));
app.route("/api/chat", createChatRoutes(chatController));

// WebSocket
app.get("/ws", wsRoute);

// Health check
app.get("/", (c) => c.text("OK"));

export default {
  port: Number(env.BETTER_AUTH_URL.split(":").pop()) || 3000,
  fetch: app.fetch,
  websocket,
};
```

**Step 5: Commit**

```bash
git add apps/server/src/ws/ apps/server/src/index.ts
git commit -m "feat: add WebSocket infrastructure with connection manager, message handler, and route mounting"
```

---

## Phase 5: Frontend - Hooks, WebSocket Client & API Layer

### Task 17: Create WebSocket client and hooks

**Files:**
- Create: `apps/web/src/lib/ws-client.ts`
- Create: `apps/web/src/hooks/use-websocket.ts`
- Create: `apps/web/src/hooks/use-chat.ts`
- Create: `apps/web/src/hooks/use-notifications.ts`

**Step 1: Create WebSocket client singleton**

```typescript
// lib/ws-client.ts
import { env } from "@chat-application/env/web";

type MessageHandler = (data: any) => void;

class WsClient {
  private ws: WebSocket | null = null;
  private handlers = new Map<string, Set<MessageHandler>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const wsUrl = env.NEXT_PUBLIC_SERVER_URL.replace("http", "ws") + "/ws";
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const handlers = this.handlers.get(msg.type);
        if (handlers) {
          handlers.forEach((handler) => handler(msg.data));
        }
      } catch {}
    };

    this.ws.onclose = () => {
      this.reconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;

    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  send(type: string, data?: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }

  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsClient = new WsClient();
```

**Step 2: Create useWebSocket hook**

```typescript
// hooks/use-websocket.ts
"use client";

import { useEffect, useRef } from "react";
import { wsClient } from "@/lib/ws-client";

export function useWebSocket() {
  const connected = useRef(false);

  useEffect(() => {
    if (!connected.current) {
      wsClient.connect();
      connected.current = true;
    }

    return () => {
      // Don't disconnect on unmount - the WS connection is shared
      // Disconnection happens when the user logs out
    };
  }, []);

  return {
    send: wsClient.send.bind(wsClient),
    on: wsClient.on.bind(wsClient),
    disconnect: wsClient.disconnect.bind(wsClient),
  };
}
```

**Step 3: Create useChat hook**

```typescript
// hooks/use-chat.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { wsClient } from "@/lib/ws-client";

interface ChatMessage {
  content: string;
  senderName: string;
  timestamp: string;
  isOwn: boolean;
}

export function useAnonymousChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<
    "idle" | "searching" | "matched" | "ended"
  >("idle");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [myName, setMyName] = useState<string>("");
  const [partnerName, setPartnerName] = useState<string>("");
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const unsubs = [
      wsClient.on("matchmaking:matched", (data) => {
        setStatus("matched");
        setRoomId(data.roomId);
        setMyName(data.anonymousName);
        setPartnerName(data.partnerName);
        setMessages([]);
      }),
      wsClient.on("matchmaking:timeout", () => {
        setStatus("idle");
      }),
      wsClient.on("chat:message", (data) => {
        setMessages((prev) => [
          ...prev,
          {
            content: data.content,
            senderName: data.senderName,
            timestamp: data.timestamp,
            isOwn: false,
          },
        ]);
      }),
      wsClient.on("chat:ended", (data) => {
        setStatus("ended");
        setPartnerId(data.partnerId);
      }),
      wsClient.on("chat:typing", (data) => {
        setPartnerTyping(data.isTyping);
      }),
    ];

    return () => unsubs.forEach((unsub) => unsub());
  }, []);

  const startSearch = useCallback((genderPreference?: string) => {
    setStatus("searching");
    wsClient.send("matchmaking:join", { genderPreference });
  }, []);

  const cancelSearch = useCallback(() => {
    setStatus("idle");
    wsClient.send("matchmaking:cancel");
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      if (!roomId) return;
      wsClient.send("chat:message", { roomId, content });
      setMessages((prev) => [
        ...prev,
        {
          content,
          senderName: myName,
          timestamp: new Date().toISOString(),
          isOwn: true,
        },
      ]);
    },
    [roomId, myName]
  );

  const endChat = useCallback(() => {
    if (!roomId) return;
    wsClient.send("chat:end", { roomId });
  }, [roomId]);

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!roomId) return;
      wsClient.send("chat:typing", { roomId, isTyping });
    },
    [roomId]
  );

  const handleTypingInput = useCallback(() => {
    sendTyping(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => sendTyping(false), 1500);
  }, [sendTyping]);

  const reset = useCallback(() => {
    setStatus("idle");
    setRoomId(null);
    setMessages([]);
    setMyName("");
    setPartnerName("");
    setPartnerId(null);
    setPartnerTyping(false);
  }, []);

  return {
    messages,
    status,
    roomId,
    myName,
    partnerName,
    partnerTyping,
    partnerId,
    startSearch,
    cancelSearch,
    sendMessage,
    endChat,
    handleTypingInput,
    reset,
  };
}
```

**Step 4: Create useNotifications hook**

```typescript
// hooks/use-notifications.ts
"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { wsClient } from "@/lib/ws-client";
import { env } from "@chat-application/env/web";

const API = env.NEXT_PUBLIC_SERVER_URL;

async function fetchNotifications() {
  const res = await fetch(`${API}/api/notifications`, {
    credentials: "include",
  });
  return res.json();
}

async function fetchUnreadCount(): Promise<number> {
  const res = await fetch(`${API}/api/notifications/unread-count`, {
    credentials: "include",
  });
  const data = await res.json();
  return data.count;
}

export function useNotifications() {
  const queryClient = useQueryClient();

  const { data: notifications = [], ...query } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: fetchUnreadCount,
  });

  // Listen for real-time notifications
  useEffect(() => {
    const unsub = wsClient.on("notification:new", () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });
    return unsub;
  }, [queryClient]);

  const markAsRead = async (id: string) => {
    await fetch(`${API}/api/notifications/${id}/read`, {
      method: "PATCH",
      credentials: "include",
    });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markAllAsRead = async () => {
    await fetch(`${API}/api/notifications/read-all`, {
      method: "PATCH",
      credentials: "include",
    });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    ...query,
  };
}
```

**Step 5: Commit**

```bash
git add apps/web/src/lib/ws-client.ts apps/web/src/hooks/
git commit -m "feat: add WebSocket client, useAnonymousChat, useWebSocket, useNotifications hooks"
```

---

## Phase 6: Frontend - Pages & UI Components

### Task 18: Build chat UI components (use frontend-design skill)

**Files:**
- Create: `apps/web/src/components/chat/chat-window.tsx`
- Create: `apps/web/src/components/chat/message-bubble.tsx`
- Create: `apps/web/src/components/chat/typing-indicator.tsx`
- Create: `apps/web/src/components/chat/matchmaking-screen.tsx`

Use the `frontend-design` skill for this task. These components should be:

- **chat-window.tsx**: Reusable chat container with scrollable message list, auto-scroll on new messages, and message input with send button. Input triggers `onTyping` callback for debounced typing indicator.
- **message-bubble.tsx**: Individual message with sender name, content, timestamp. Own messages right-aligned, partner messages left-aligned. Anonymous-friendly (shows anonymous name).
- **typing-indicator.tsx**: Animated dots "Partner is typing..." component.
- **matchmaking-screen.tsx**: Full-page screen with animated searching state (pulse animation), 60s countdown timer, cancel button. Shows "matched!" transition state.

**Step N: Commit after building**

```bash
git add apps/web/src/components/chat/
git commit -m "feat: add chat UI components (chat window, message bubble, typing indicator, matchmaking)"
```

---

### Task 19: Build anonymous chat page (use frontend-design skill)

**Files:**
- Modify: `apps/web/src/app/(chat)/chat/anonymously/page.tsx`

Use the `frontend-design` skill. This page orchestrates:

1. **Idle state**: "Start Chat" button + optional gender preference selector (shown only if premium)
2. **Searching state**: MatchmakingScreen component with 60s timer
3. **Matched state**: ChatWindow component with partner's anonymous name
4. **Ended state**: "Chat ended" screen with "Add Friend" button + "New Chat" button

Uses the `useAnonymousChat` hook for all state management.

**Commit after building.**

---

### Task 20: Build group pages (use frontend-design skill)

**Files:**
- Modify: `apps/web/src/app/(chat)/chat/groups/page.tsx`
- Create: `apps/web/src/app/(chat)/chat/groups/[groupId]/page.tsx`
- Create: `apps/web/src/app/(chat)/chat/groups/create/page.tsx`

Use the `frontend-design` skill. Pages:

1. **Groups list** (`page.tsx`): Tabs for "Public Groups" and "My Groups". Public groups show join button. Search/filter. "Join by Code" button for private groups (modal with code input). "Create Group" button.
2. **Group chat** (`[groupId]/page.tsx`): ChatWindow with group messages. Member list in sidebar. Load history from API on mount via TanStack Query. Real-time messages via WebSocket.
3. **Create group** (`create/page.tsx`): Form with name, type (public/private), max members. Shows invite code after creation for private groups.

**Commit after building.**

---

### Task 21: Build friend DM page and update sidebar (use frontend-design skill)

**Files:**
- Create: `apps/web/src/app/(chat)/chat/friends/[friendshipId]/page.tsx`
- Modify: `apps/web/src/components/sidebar/nav-main.tsx`
- Create: `apps/web/src/components/sidebar/notification-bell.tsx`

Use the `frontend-design` skill. Components:

1. **Friend DM page**: ChatWindow with friend's name. Load message history from API. Real-time messages via WebSocket.
2. **nav-main.tsx update**: Show real friends list from API (TanStack Query). Online/offline indicator (green/gray dot). Click to open DM. Pending friend requests section.
3. **notification-bell.tsx**: Bell icon with unread count badge. Dropdown showing notification list. Click to mark as read.

**Commit after building.**

---

### Task 22: Build settings and premium pages (use frontend-design skill)

**Files:**
- Create: `apps/web/src/app/(chat)/chat/settings/page.tsx`
- Create: `apps/web/src/app/(chat)/chat/premium/page.tsx`

Use the `frontend-design` skill. Pages:

1. **Settings page**: Toggle anonymous/public profile. Display gender, country (editable). Manage subscription (link to Stripe billing portal if premium).
2. **Premium page**: Feature comparison (free vs premium). "Subscribe" button that calls `authClient.subscription.upgrade({ plan: "premium", successUrl: "/chat", cancelUrl: "/chat/premium" })`. Show current subscription status if already premium.

**Commit after building.**

---

### Task 23: Update chat dashboard page (use frontend-design skill)

**Files:**
- Modify: `apps/web/src/app/(chat)/chat/page.tsx`

Use the `frontend-design` skill. The main `/chat` dashboard should show:

1. Welcome message with user's name
2. Quick action cards: "Chat Anonymously", "Browse Groups", "View Friends"
3. Recent activity (last chat, pending friend requests count)
4. Premium upsell card if not premium

**Commit after building.**

---

## Phase 7: Integration & Polish

### Task 24: Add WebSocket provider to chat layout

**Files:**
- Modify: `apps/web/src/app/(chat)/chat/layout.tsx`

**Step 1: Connect WebSocket on chat layout mount**

The chat layout should call `useWebSocket()` to establish the connection when the user enters the chat section. Also check `user.onboarded` and redirect to `/onboarding` if false.

**Commit after building.**

---

### Task 25: Matchmaking polling loop on server

**Files:**
- Modify: `apps/server/src/ws/message-handler.ts`

The current matchmaking only checks for a match when a user joins. Add a simple polling mechanism:

When user joins queue and no immediate match is found, set a 3-second interval that retries `findMatch`. Clear the interval on match, cancel, or disconnect. Stop after 60s (timeout).

```typescript
// After the "no match found" case in matchmaking:join handler:
const intervalId = setInterval(async () => {
  const result = await matchmakingController.handleFindMatch(queueKey, userId);
  if (result.matched) {
    clearInterval(intervalId);
    // ... send matched events (same code as immediate match)
  }
}, 3000);

// Store intervalId so it can be cleared on cancel/disconnect
setTimeout(() => {
  clearInterval(intervalId);
  if (userQueueKeys.has(userId)) {
    connectionManager.sendTo(userId, { type: "matchmaking:timeout" });
    matchmakingController.handleLeaveQueue(userId, queueKey);
    userQueueKeys.delete(userId);
  }
}, 60000);
```

**Commit after building.**

---

### Task 26: Wire real-time notifications through WebSocket

**Files:**
- Modify: `apps/server/src/modules/notification/notification.service.ts`

Update the `create` method to also push a real-time WebSocket notification:

```typescript
import { connectionManager } from "../../ws/connection-manager";

async create(data: { ... }) {
  const [created] = await this.notificationRepo.create(data);

  // Push real-time notification via WebSocket
  connectionManager.sendTo(data.userId, {
    type: "notification:new",
    data: created,
  });

  return created;
}
```

**Commit after building.**

---

### Task 27: Final verification and type checking

**Step 1: Run type checks**

```bash
bun run check-types
```

Fix any TypeScript errors across the monorepo.

**Step 2: Start all services and verify**

```bash
bun run db:start    # Start Postgres + Redis
bun run db:push     # Sync schema
bun run dev         # Start both web and server
```

**Step 3: Manual verification checklist**

- [ ] Email signup/login works
- [ ] Google OAuth button present (will fail without real credentials, but button renders)
- [ ] Onboarding page shows after first login
- [ ] WebSocket connects on `/chat` page
- [ ] Anonymous chat matchmaking works between two browser tabs
- [ ] Typing indicator shows during anonymous chat
- [ ] End chat works and shows "Add Friend" option
- [ ] Friend request flow works
- [ ] Notification bell updates
- [ ] Group creation (public + private) works
- [ ] Group chat messages persist
- [ ] Settings page renders
- [ ] Premium page renders with Stripe button

**Step 4: Final commit**

```bash
git add .
git commit -m "fix: resolve type errors and polish integration"
```

---

## Summary of Phases

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-4 | Foundation: DB schema, Redis, env vars |
| 2 | 5-8 | Auth: Google OAuth, Stripe plugin, onboarding, TanStack Query |
| 3 | 9-15 | Backend modules: User, Friendship, Notification, Group, Chat, Matchmaking |
| 4 | 16 | WebSocket: Connection manager, message handler, server integration |
| 5 | 17 | Frontend: WS client, hooks (useChat, useNotifications, useWebSocket) |
| 6 | 18-23 | Frontend pages: Chat UI, anonymous chat, groups, friends, settings, premium, dashboard |
| 7 | 24-27 | Integration: WS provider, matchmaking loop, real-time notifications, type checks |

**Total: 27 tasks across 7 phases.**
