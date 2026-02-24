# WebSocket Fix, Sidebar Improvements & Country Matchmaking — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the WebSocket `ws.data` crash, improve sidebar UI (real user data, gender chat button, support/feedback pages), and add country-based matchmaking with restcountries.com API + flags.

**Architecture:** The WebSocket fix passes `userData` explicitly instead of relying on Hono's wrapper. Sidebar fetches real user profile via `useProfile()`. Country data comes from restcountries.com cached client-side, stored as ISO alpha-2 codes. Matchmaking uses combined queue keys (`country:XX:gender:YY`) with the existing Redis queue system.

**Tech Stack:** Bun, Hono, Better Auth, Drizzle ORM, React, Next.js, TanStack Query, restcountries.com API, Redis

---

### Task 1: Fix WebSocket `ws.data` crash

**Files:**
- Modify: `apps/server/src/ws/connection-manager.ts`
- Modify: `apps/server/src/ws/message-handler.ts`
- Modify: `apps/server/src/ws/index.ts`

**Step 1: Add `country` to `WsUserData` interface**

In `apps/server/src/ws/connection-manager.ts`, add `country` field:

```typescript
export interface WsUserData {
  userId: string;
  gender?: string;
  country?: string;
  isPremium: boolean;
}
```

**Step 2: Change `handleWsMessage` to accept `userData` param**

In `apps/server/src/ws/message-handler.ts`, change line 22-23 from:

```typescript
export async function handleWsMessage(ws: ServerWebSocket<WsUserData>, raw: string) {
  const { userId, gender, isPremium } = ws.data;
```

To:

```typescript
export async function handleWsMessage(ws: ServerWebSocket<WsUserData>, raw: string, userData: WsUserData) {
  const { userId, gender, country, isPremium } = userData;
```

**Step 3: Update `ws/index.ts` to pass `userData` and extract `country`**

In `apps/server/src/ws/index.ts`, update the `userData` creation to include `country`, and pass `userData` to handlers:

```typescript
const userData: WsUserData = {
  userId: session.user.id,
  gender: (session.user as any).gender,
  country: (session.user as any).country,
  isPremium: (session.user as any).isPremium ?? false,
};

return {
  onOpen(_event, ws) {
    connectionManager.add(userData.userId, ws as any);
  },
  onMessage(event, ws) {
    handleWsMessage(ws as any, event.data as string, userData);
  },
  onClose() {
    handleWsClose(userData.userId);
  },
};
```

**Step 4: Verify server compiles**

Run: `cd apps/server && bun run check-types`
Expected: No type errors

**Step 5: Commit**

```bash
git add apps/server/src/ws/
git commit -m "fix: pass userData explicitly to WS handlers instead of relying on ws.data"
```

---

### Task 2: Create `useCountries` hook and `CountrySelector` component

**Files:**
- Create: `apps/web/src/hooks/use-countries.ts`
- Create: `apps/web/src/components/country-selector.tsx`

**Step 1: Create the `useCountries` hook**

Create `apps/web/src/hooks/use-countries.ts`:

```typescript
import { useQuery } from "@tanstack/react-query";

export interface Country {
  name: string;
  code: string;
  flagUrl: string;
}

export function useCountries() {
  return useQuery<Country[]>({
    queryKey: ["countries"],
    queryFn: async () => {
      const res = await fetch(
        "https://restcountries.com/v3.1/all?fields=name,cca2,flags"
      );
      if (!res.ok) throw new Error("Failed to fetch countries");
      const data = await res.json();
      return data
        .map((c: any) => ({
          name: c.name.common,
          code: c.cca2,
          flagUrl: c.flags.svg,
        }))
        .sort((a: Country, b: Country) => a.name.localeCompare(b.name));
    },
    staleTime: 1000 * 60 * 60 * 24,
  });
}
```

**Step 2: Create the `CountrySelector` component**

Create `apps/web/src/components/country-selector.tsx`. This should use the `frontend-design` skill for styling. It needs:

- A button that shows the currently selected country (flag + name) or "Select country"
- A popover/dropdown with a search input at the top
- Scrollable list of countries with flag + name
- An "Any Country" option at the top (for matchmaking use — controlled via prop)
- Props: `value`, `onChange`, `showAny?: boolean`, `placeholder?: string`

```typescript
"use client";

import { useState } from "react";
import { useCountries } from "@/hooks/use-countries";
import { ChevronsUpDown, Check, Globe, Loader2 } from "lucide-react";

interface CountrySelectorProps {
  value: string;
  onChange: (code: string) => void;
  showAny?: boolean;
  placeholder?: string;
}

export function CountrySelector({
  value,
  onChange,
  showAny = false,
  placeholder = "Select country",
}: CountrySelectorProps) {
  const { data: countries, isLoading } = useCountries();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = countries?.find((c) => c.code === value);

  const filtered = countries?.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading countries...
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <img
              src={selected.flagUrl}
              alt={selected.name}
              className="h-4 w-6 rounded-sm object-cover"
            />
            {selected.name}
          </span>
        ) : value === "any" ? (
          <span className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Any Country
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {showAny && (
              <button
                type="button"
                onClick={() => {
                  onChange("any");
                  setOpen(false);
                  setSearch("");
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Globe className="h-4 w-4" />
                <span>Any Country</span>
                {value === "any" && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </button>
            )}
            {filtered?.map((country) => (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  onChange(country.code);
                  setOpen(false);
                  setSearch("");
                }}
                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              >
                <img
                  src={country.flagUrl}
                  alt={country.name}
                  className="h-4 w-6 rounded-sm object-cover"
                />
                <span>{country.name}</span>
                {value === country.code && (
                  <Check className="ml-auto h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add apps/web/src/hooks/use-countries.ts apps/web/src/components/country-selector.tsx
git commit -m "feat: add useCountries hook and CountrySelector component with flags"
```

---

### Task 3: Update Onboarding page with CountrySelector

**Files:**
- Modify: `apps/web/src/app/(base)/onboarding/page.tsx`

**Step 1: Replace free-text country input with CountrySelector**

Replace the entire file content. Key changes:
- Import `CountrySelector`
- Replace the `<input type="text">` for country with `<CountrySelector value={...} onChange={...} />`
- Country now stores ISO code instead of free text

```typescript
"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CountrySelector } from "@/components/country-selector";
import { env } from "@chat-application/env/web";

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
        `${env.NEXT_PUBLIC_SERVER_URL}/api/user/onboard`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(parsed.data),
        },
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
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Complete Your Profile
          </h1>
          <p className="text-sm text-muted-foreground">
            Tell us a bit about yourself to get started
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-6"
        >
          <form.Field name="gender">
            {(field) => (
              <div className="space-y-3">
                <label className="text-sm font-medium">Gender</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["male", "female", "other"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => field.handleChange(g)}
                      className={`rounded-lg border-2 p-3 text-sm font-medium capitalize transition-all ${
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

          <form.Field name="country">
            {(field) => (
              <div className="space-y-2">
                <label className="text-sm font-medium">Country</label>
                <CountrySelector
                  value={field.state.value}
                  onChange={(code) => field.handleChange(code)}
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

**Step 2: Commit**

```bash
git add apps/web/src/app/(base)/onboarding/page.tsx
git commit -m "feat: replace free-text country input with CountrySelector on onboarding"
```

---

### Task 4: Update Settings page with CountrySelector

**Files:**
- Modify: `apps/web/src/app/(chat)/chat/settings/page.tsx`

**Step 1: Replace free-text country input with CountrySelector**

Add import at top:
```typescript
import { CountrySelector } from "@/components/country-selector";
```

Replace the country `<input>` block (lines 84-92) with:
```typescript
<CountrySelector
  value={country}
  onChange={(code) => setCountry(code)}
/>
```

**Step 2: Commit**

```bash
git add apps/web/src/app/(chat)/chat/settings/page.tsx
git commit -m "feat: use CountrySelector with flags in settings page"
```

---

### Task 5: Update Sidebar — real user data, remove Settings, add Gender Chat

**Files:**
- Modify: `apps/web/src/components/sidebar/app-sidebar.tsx`
- Modify: `apps/web/src/components/sidebar/nav-platform.tsx`
- Modify: `apps/web/src/components/sidebar/nav-user.tsx`

**Step 1: Make `AppSidebar` a client component that fetches real user**

Replace `apps/web/src/components/sidebar/app-sidebar.tsx`:

```typescript
"use client";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavSecondary } from "@/components/sidebar/nav-secondary";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LifeBuoyIcon, SendIcon } from "lucide-react";
import { NavPlatform } from "./nav-platform";
import { useProfile } from "@/hooks/use-profile";

const navSecondary = [
  { title: "Support", url: "/support", icon: <LifeBuoyIcon /> },
  { title: "Feedback", url: "/feedback", icon: <SendIcon /> },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: profile } = useProfile();

  return (
    <Sidebar
      variant="floating"
      collapsible="icon"
      {...props}
      suppressHydrationWarning
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="#" />}>
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-primary via-secondary to-primary/55 shadow-lg">
                  C
                </div>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Chatty</span>
                <span className="truncate text-xs">Anonymous Chatting</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
        <NavPlatform isPremium={profile?.isPremium ?? false} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: profile?.name ?? "",
            email: profile?.email ?? "",
            avatar: profile?.image ?? "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
```

**Step 2: Update `NavPlatform` — remove Settings, add Gender Chat button**

Replace `apps/web/src/components/sidebar/nav-platform.tsx`:

```typescript
"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Crown } from "lucide-react";
import { useRouter } from "next/navigation";

export function NavPlatform({ isPremium }: { isPremium: boolean }) {
  const router = useRouter();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu className="space-y-3">
        <SidebarMenuItem>
          <SidebarMenuButton
            className="border-primary border"
            variant={"outline"}
            render={<a href={"/chat/anonymously"} />}
          >
            <span>Random Chat</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            className="border-primary border"
            variant={"outline"}
            onClick={() => {
              if (isPremium) {
                router.push("/chat/anonymously?genderPref=true" as any);
              } else {
                router.push("/pricing" as any);
              }
            }}
          >
            <Crown className="h-4 w-4" />
            <span>Gender Chat</span>
            {!isPremium && (
              <span className="ml-auto text-[10px] font-medium text-muted-foreground">PRO</span>
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton
            className="border-primary border"
            variant={"outline"}
            render={<a href={"/chat/groups"} />}
          >
            <span>Group Chats</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
```

**Step 3: Update `NavUser` to accept optional avatar image**

In `apps/web/src/components/sidebar/nav-user.tsx`, the component already accepts `user` with `avatar` string. No changes needed to the interface — just ensure the `AvatarImage` `src` handles empty strings gracefully, which it already does (AvatarFallback shows instead).

**Step 4: Commit**

```bash
git add apps/web/src/components/sidebar/
git commit -m "feat: sidebar uses real user data, adds Gender Chat button, removes Settings"
```

---

### Task 6: Create Support and Feedback pages + backend

**Files:**
- Create: `packages/db/src/schema/support.ts`
- Modify: `packages/db/src/schema/index.ts`
- Create: `apps/server/src/modules/support/support.repository.ts`
- Create: `apps/server/src/modules/support/support.service.ts`
- Create: `apps/server/src/modules/support/support.controller.ts`
- Create: `apps/server/src/modules/support/support.routes.ts`
- Modify: `apps/server/src/lib/container.ts`
- Modify: `apps/server/src/index.ts`
- Create: `apps/web/src/app/(base)/support/page.tsx`
- Create: `apps/web/src/app/(base)/feedback/page.tsx`

**Step 1: Create DB schema for support tickets and feedback**

Create `packages/db/src/schema/support.ts`:

```typescript
import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";

export const supportTicket = pgTable("support_ticket", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  rating: integer("rating").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Step 2: Export from schema index**

In `packages/db/src/schema/index.ts`, add:

```typescript
export * from "./support";
```

**Step 3: Generate DB migration**

Run: `cd packages/db && bun run generate`
(Or whatever the drizzle migration command is for this project)

**Step 4: Create backend support repository**

Create `apps/server/src/modules/support/support.repository.ts`:

```typescript
import { supportTicket, feedback } from "@chat-application/db/schema/support";
import type { db as DB } from "@chat-application/db";

type Database = typeof DB;

export class SupportRepository {
  constructor(private db: Database) {}

  async createTicket(data: { name: string; email: string; subject: string; message: string }) {
    const [ticket] = await this.db.insert(supportTicket).values(data).returning();
    return ticket;
  }

  async createFeedback(data: { name: string; email: string; rating: number; message: string }) {
    const [entry] = await this.db.insert(feedback).values(data).returning();
    return entry;
  }
}
```

**Step 5: Create backend support service**

Create `apps/server/src/modules/support/support.service.ts`:

```typescript
import type { SupportRepository } from "./support.repository";

export class SupportService {
  constructor(private repo: SupportRepository) {}

  async submitTicket(data: { name: string; email: string; subject: string; message: string }) {
    return this.repo.createTicket(data);
  }

  async submitFeedback(data: { name: string; email: string; rating: number; message: string }) {
    return this.repo.createFeedback(data);
  }
}
```

**Step 6: Create backend support controller**

Create `apps/server/src/modules/support/support.controller.ts`:

```typescript
import type { Context } from "hono";
import type { SupportService } from "./support.service";

export class SupportController {
  constructor(private supportService: SupportService) {}

  submitTicket = async (c: Context) => {
    const body = await c.req.json<{
      name: string;
      email: string;
      subject: string;
      message: string;
    }>();
    const ticket = await this.supportService.submitTicket(body);
    return c.json(ticket, 201);
  };

  submitFeedback = async (c: Context) => {
    const body = await c.req.json<{
      name: string;
      email: string;
      rating: number;
      message: string;
    }>();
    const entry = await this.supportService.submitFeedback(body);
    return c.json(entry, 201);
  };
}
```

**Step 7: Create backend support routes**

Create `apps/server/src/modules/support/support.routes.ts`:

```typescript
import { Hono } from "hono";
import type { SupportController } from "./support.controller";

export function createSupportRoutes(controller: SupportController) {
  const router = new Hono();
  router.post("/ticket", controller.submitTicket);
  router.post("/feedback", controller.submitFeedback);
  return router;
}
```

**Step 8: Wire up in container**

In `apps/server/src/lib/container.ts`, add imports and wiring:

```typescript
// Add imports:
import { SupportRepository } from "../modules/support/support.repository";
import { SupportService } from "../modules/support/support.service";
import { SupportController } from "../modules/support/support.controller";

// Add to Repositories section:
const supportRepo = new SupportRepository(db);

// Add to Services section:
const supportService = new SupportService(supportRepo);

// Add to Controllers section:
export const supportController = new SupportController(supportService);
```

**Step 9: Add route to server index**

In `apps/server/src/index.ts`, add:

```typescript
import { createSupportRoutes } from "./modules/support/support.routes";
import { supportController } from "./lib/container";

// Add with other routes:
app.route("/api/support", createSupportRoutes(supportController));
```

**Step 10: Create Support page**

Create `apps/web/src/app/(base)/support/page.tsx`. Use the `frontend-design` skill for styling. Core functionality:

```typescript
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
```

**Step 11: Create Feedback page**

Create `apps/web/src/app/(base)/feedback/page.tsx`. Use `frontend-design` skill for styling. Core functionality:

```typescript
"use client";

import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { env } from "@chat-application/env/web";

const feedbackSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  rating: z.number().min(1).max(5),
  message: z.string().min(5, "Please provide some feedback"),
});

export default function FeedbackPage() {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  const form = useForm({
    defaultValues: { name: "", email: "", message: "" },
    onSubmit: async ({ value }) => {
      const parsed = feedbackSchema.safeParse({ ...value, rating });
      if (!parsed.success) {
        toast.error(parsed.error.errors[0].message);
        return;
      }
      const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/api/support/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
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
              <Send className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Feedback</h1>
              <p className="text-sm text-muted-foreground">We'd love to hear from you</p>
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
        </div>
      </div>
    </div>
  );
}
```

**Step 12: Commit**

```bash
git add packages/db/src/schema/support.ts packages/db/src/schema/index.ts
git add apps/server/src/modules/support/
git add apps/server/src/lib/container.ts apps/server/src/index.ts
git add apps/web/src/app/(base)/support/ apps/web/src/app/(base)/feedback/
git commit -m "feat: add support and feedback pages with backend endpoints"
```

---

### Task 7: Add country-based matchmaking to backend

**Files:**
- Modify: `apps/server/src/modules/matchmaking/matchmaking.service.ts`
- Modify: `apps/server/src/modules/matchmaking/matchmaking.controller.ts`
- Modify: `apps/server/src/ws/message-handler.ts`

**Step 1: Update `QueueEntry` and `joinQueue` in matchmaking service**

In `apps/server/src/modules/matchmaking/matchmaking.service.ts`:

Add `country` to `QueueEntry`:
```typescript
export interface QueueEntry {
  userId: string;
  gender?: string;
  country?: string;
  isPremium: boolean;
  timestamp: number;
}
```

Update `joinQueue` to accept `countryPreference`:
```typescript
async joinQueue(entry: QueueEntry, genderPreference?: string, countryPreference?: string): Promise<string> {
  let queueKey = `${this.QUEUE_PREFIX}`;
  const parts: string[] = [];

  if (countryPreference && countryPreference !== "any") {
    parts.push(`country:${countryPreference}`);
  }
  if (genderPreference) {
    parts.push(`gender:${genderPreference}`);
  }

  queueKey += parts.length > 0 ? parts.join(":") : "random";

  await this.redis.send("LPUSH", [queueKey, JSON.stringify(entry)]);
  return queueKey;
}
```

**Step 2: Update matchmaking controller**

In `apps/server/src/modules/matchmaking/matchmaking.controller.ts`, update `handleJoinQueue`:

```typescript
async handleJoinQueue(
  userId: string,
  gender: string | undefined,
  country: string | undefined,
  isPremium: boolean,
  genderPreference?: string,
  countryPreference?: string,
): Promise<{ queueKey: string }> {
  if (genderPreference && !isPremium) {
    throw new Error("Gender preference matching requires premium");
  }
  const entry: QueueEntry = { userId, gender, country, isPremium, timestamp: Date.now() };
  const queueKey = await this.matchmakingService.joinQueue(entry, genderPreference, countryPreference);
  return { queueKey };
}
```

**Step 3: Update message handler to pass country and countryPreference**

In `apps/server/src/ws/message-handler.ts`, update the `matchmaking:join` case:

Change the `handleJoinQueue` call from:
```typescript
const { queueKey } = await matchmakingController.handleJoinQueue(
  userId, gender, isPremium, msg.data?.genderPreference
);
```

To:
```typescript
const { queueKey } = await matchmakingController.handleJoinQueue(
  userId, gender, country, isPremium, msg.data?.genderPreference, msg.data?.countryPreference
);
```

**Step 4: Verify server compiles**

Run: `bun run check-types`
Expected: No type errors

**Step 5: Commit**

```bash
git add apps/server/src/modules/matchmaking/ apps/server/src/ws/message-handler.ts
git commit -m "feat: add country-based matchmaking queue keys"
```

---

### Task 8: Add country preference to matchmaking frontend

**Files:**
- Modify: `apps/web/src/hooks/use-chat.ts`
- Modify: `apps/web/src/components/chat/matchmaking-screen.tsx`
- Modify: `apps/web/src/app/(chat)/chat/anonymously/page.tsx`

**Step 1: Update `useAnonymousChat` to accept `countryPreference`**

In `apps/web/src/hooks/use-chat.ts`, update `startSearch`:

```typescript
const startSearch = useCallback((genderPreference?: string, countryPreference?: string) => {
  setStatus("searching");
  wsClient.send("matchmaking:join", { genderPreference, countryPreference });
}, []);
```

**Step 2: Update `MatchmakingScreen` to include country selector**

In `apps/web/src/components/chat/matchmaking-screen.tsx`:

Add to imports:
```typescript
import { CountrySelector } from "@/components/country-selector";
```

Update props interface:
```typescript
interface MatchmakingScreenProps {
  status: "idle" | "searching" | "matched";
  onStartSearch: (genderPreference?: string, countryPreference?: string) => void;
  onCancel: () => void;
  isPremium?: boolean;
  userCountry?: string;
  partnerName?: string;
}
```

Add `countryPref` state alongside `genderPref`:
```typescript
const [countryPref, setCountryPref] = useState<string>(userCountry || "any");
```

Add country selector in the idle state, below the gender preference section and above the Start Chat button:
```typescript
<div className="w-full max-w-xs space-y-2">
  <span className="text-xs text-muted-foreground">Country preference:</span>
  <CountrySelector
    value={countryPref}
    onChange={setCountryPref}
    showAny
  />
</div>
```

Update the Start Chat button onClick:
```typescript
<Button size="lg" onClick={() => onStartSearch(genderPref, countryPref === "any" ? undefined : countryPref)} className="gap-2 px-8">
```

Add `userCountry` to destructured props and default `countryPref` to it.

**Step 3: Update `AnonymousChatPage` to pass props**

In `apps/web/src/app/(chat)/chat/anonymously/page.tsx`:

Add import:
```typescript
import { useProfile } from "@/hooks/use-profile";
import { useSearchParams } from "next/navigation";
```

Inside the component:
```typescript
const { data: profile } = useProfile();
const searchParams = useSearchParams();
const showGenderPref = searchParams.get("genderPref") === "true";
```

Update the `MatchmakingScreen` usage:
```typescript
<MatchmakingScreen
  status={status}
  onStartSearch={startSearch}
  onCancel={cancelSearch}
  partnerName={partnerName}
  isPremium={profile?.isPremium}
  userCountry={profile?.country}
/>
```

**Step 4: Commit**

```bash
git add apps/web/src/hooks/use-chat.ts
git add apps/web/src/components/chat/matchmaking-screen.tsx
git add apps/web/src/app/(chat)/chat/anonymously/page.tsx
git commit -m "feat: add country preference selector to matchmaking UI"
```

---

### Task 9: Generate migration and verify

**Step 1: Generate Drizzle migration**

Run: `cd packages/db && bun run generate`

**Step 2: Run migration (if using drizzle-kit push or migrate)**

Run: `cd packages/db && bun run migrate` (or `bun run push` depending on project setup)

**Step 3: Verify full build**

Run: `bun run check-types`
Expected: No errors

**Step 4: Commit migration**

```bash
git add packages/db/src/migrations/
git commit -m "chore: generate migration for support and feedback tables"
```
