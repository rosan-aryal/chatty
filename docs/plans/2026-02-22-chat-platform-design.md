# Chat Platform - System Design

## Overview

Real-time anonymous chat platform with matchmaking, groups, friends, and premium features. Built on Bun + Hono (backend), Next.js 16 (frontend), PostgreSQL + Redis, Better Auth, Stripe.

## Key Decisions

- **IDs**: Better Auth tables keep `text` IDs. All new tables use `uuid` (UUID v7 via `Bun.randomUUIDv7()`) for time-ordered indexing performance.
- **WebSocket**: Hono native WS with Bun adapter. Single `/ws` endpoint, auth on upgrade.
- **Matchmaking**: Redis-backed queue. Free = random matching. Premium = gender-preference (M-F, F-F).
- **Messages**: Ephemeral for anonymous 1-on-1 chats. Persistent (DB-stored) for groups and friend DMs.
- **DI Pattern**: Constructor injection. Repository → Service → Controller. Simple factory container.
- **State**: TanStack Query for REST. Custom hooks for WebSocket real-time state.

---

## Database Schema (New Tables)

All new tables use UUID v7 primary keys.

### `user` table (modify existing)

Add columns:
- `gender` enum('male', 'female', 'other') nullable
- `country` text nullable
- `onboarded` boolean default false
- `is_premium` boolean default false
- `stripe_customer_id` text nullable
- `stripe_subscription_id` text nullable
- `is_anonymous` boolean default true (profile visibility preference)

### `friendship`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (v7) | PK |
| requester_id | text | FK → user.id |
| addressee_id | text | FK → user.id |
| status | enum('pending', 'accepted', 'rejected') | |
| created_at | timestamp | default now |
| updated_at | timestamp | auto-update |

Indexes: `(requester_id)`, `(addressee_id)`, unique `(requester_id, addressee_id)`

### `notification`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (v7) | PK |
| user_id | text | FK → user.id |
| type | enum('friend_request', 'friend_accepted', 'group_invite') | |
| data | jsonb | flexible payload |
| read | boolean | default false |
| created_at | timestamp | default now |

Index: `(user_id, read)`

### `group`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (v7) | PK |
| name | text | not null |
| type | enum('public', 'private') | |
| invite_code | text | nullable, for private groups |
| host_id | text | FK → user.id |
| max_members | int | default 50 |
| created_at | timestamp | default now |

Index: `(host_id)`, unique `(invite_code)` where not null

### `group_member`

| Column | Type | Notes |
|--------|------|-------|
| group_id | uuid | FK → group.id |
| user_id | text | FK → user.id |
| role | enum('host', 'admin', 'member') | |
| joined_at | timestamp | default now |

PK: `(group_id, user_id)`

### `message`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (v7) | PK |
| content | text | not null |
| sender_id | text | FK → user.id |
| group_id | uuid | FK → group.id, nullable |
| friendship_id | uuid | FK → friendship.id, nullable |
| created_at | timestamp | default now |

Indexes: `(group_id, created_at)`, `(friendship_id, created_at)`
Check: exactly one of `group_id` or `friendship_id` is non-null.

### `subscription`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (v7) | PK |
| user_id | text | FK → user.id |
| stripe_subscription_id | text | not null |
| stripe_customer_id | text | not null |
| status | enum('active', 'canceled', 'past_due') | |
| current_period_end | timestamp | |
| created_at | timestamp | default now |
| updated_at | timestamp | auto-update |

Index: `(user_id)`, unique `(stripe_subscription_id)`

---

## Backend Architecture

```
apps/server/src/
├── index.ts                         # Hono app, middleware, mount routes
├── ws.ts                            # WebSocket upgrade + connection manager
├── lib/
│   ├── container.ts                 # DI wiring
│   ├── redis.ts                     # ioredis client
│   └── auth-middleware.ts           # Session extraction middleware
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.routes.ts
│   ├── user/
│   │   ├── user.repository.ts
│   │   ├── user.service.ts
│   │   ├── user.controller.ts
│   │   └── user.routes.ts
│   ├── matchmaking/
│   │   ├── matchmaking.service.ts   # Redis queue logic
│   │   ├── matchmaking.controller.ts
│   │   └── matchmaking.routes.ts
│   ├── chat/
│   │   ├── chat.repository.ts
│   │   ├── chat.service.ts
│   │   ├── chat.controller.ts
│   │   └── chat.routes.ts
│   ├── group/
│   │   ├── group.repository.ts
│   │   ├── group.service.ts
│   │   ├── group.controller.ts
│   │   └── group.routes.ts
│   ├── friendship/
│   │   ├── friendship.repository.ts
│   │   ├── friendship.service.ts
│   │   ├── friendship.controller.ts
│   │   └── friendship.routes.ts
│   ├── notification/
│   │   ├── notification.repository.ts
│   │   ├── notification.service.ts
│   │   ├── notification.controller.ts
│   │   └── notification.routes.ts
│   └── subscription/
│       ├── subscription.repository.ts
│       ├── subscription.service.ts
│       ├── subscription.controller.ts
│       └── subscription.routes.ts
```

### DI Container

```typescript
// lib/container.ts
const userRepo = new UserRepository(db);
const userService = new UserService(userRepo);
const userController = new UserController(userService);
// ... all modules follow this pattern
export { userController, groupController, ... }
```

### Redis Usage

- **Matchmaking queues**: `matchmaking:queue:random`, `matchmaking:queue:male`, `matchmaking:queue:female` (Redis Lists - LPUSH/RPOP)
- **Online tracking**: `ws:online:{userId}` (Redis SET with TTL)
- **Pub/Sub**: `chat:{roomId}`, `notifications:{userId}`, `typing:{roomId}`

---

## WebSocket Protocol

Single `/ws` endpoint. All messages are JSON with `type` field.

### Client → Server

| Type | Data | Description |
|------|------|-------------|
| `matchmaking:join` | `{ genderPreference?: string }` | Join matchmaking queue |
| `matchmaking:cancel` | `{}` | Leave queue |
| `chat:message` | `{ roomId, content }` | Send anonymous chat message |
| `chat:end` | `{ roomId }` | End anonymous conversation |
| `chat:typing` | `{ roomId, isTyping }` | Typing indicator |
| `group:message` | `{ groupId, content }` | Send group message |
| `group:typing` | `{ groupId, isTyping }` | Group typing indicator |
| `friend:message` | `{ friendshipId, content }` | Send friend DM |
| `friend:typing` | `{ friendshipId, isTyping }` | Friend typing indicator |

### Server → Client

| Type | Data | Description |
|------|------|-------------|
| `matchmaking:matched` | `{ roomId, anonymousName }` | Match found |
| `matchmaking:timeout` | `{}` | 60s timeout, no match |
| `chat:message` | `{ roomId, content, senderName, timestamp }` | Receive message |
| `chat:ended` | `{ roomId, canAddFriend }` | Conversation ended |
| `chat:typing` | `{ roomId, isTyping }` | Partner typing |
| `notification:new` | `{ id, type, data }` | Real-time notification |
| `group:message` | `{ groupId, content, senderId, senderName, timestamp }` | Group message |
| `group:typing` | `{ groupId, userId, isTyping }` | Group member typing |
| `friend:message` | `{ friendshipId, content, senderId, timestamp }` | Friend DM |
| `friend:typing` | `{ friendshipId, isTyping }` | Friend typing |
| `error` | `{ code, message }` | Error response |

### Matchmaking Flow

1. Client sends `matchmaking:join` (optional `genderPreference` if premium)
2. Server validates premium status for gender-pref requests
3. Server `LPUSH` user to appropriate Redis queue
4. Matching loop `RPOP`s two users from queue, creates room
5. Both users receive `matchmaking:matched` with `roomId` + anonymous name
6. Messages relay via `chat:message` through Redis pub/sub
7. Either user `chat:end` → both get `chat:ended` → option to send friend request
8. 60s timeout → `matchmaking:timeout` → user removed from queue

---

## Frontend Architecture

```
apps/web/src/
├── app/
│   ├── (base)/
│   │   ├── login/page.tsx              # Google + Email auth
│   │   └── onboarding/page.tsx         # Gender + Country
│   ├── (chat)/chat/
│   │   ├── layout.tsx                  # Sidebar + WS provider
│   │   ├── page.tsx                    # Dashboard
│   │   ├── anonymously/page.tsx        # Matchmaking + chat
│   │   ├── groups/
│   │   │   ├── page.tsx                # Group list
│   │   │   ├── [groupId]/page.tsx      # Group chat
│   │   │   └── create/page.tsx         # Create group
│   │   ├── friends/
│   │   │   └── [friendshipId]/page.tsx # Friend DM
│   │   ├── settings/page.tsx           # Profile + visibility
│   │   └── premium/page.tsx            # Stripe checkout
├── components/
│   ├── chat/
│   │   ├── chat-window.tsx             # Reusable message list + input
│   │   ├── message-bubble.tsx
│   │   ├── typing-indicator.tsx
│   │   └── matchmaking-screen.tsx      # Queue animation
│   ├── sidebar/ (updated)
│   │   ├── notification-bell.tsx       # Real-time badge
│   ├── auth/
│   │   ├── sign-in-form.tsx            # Updated with Google
│   │   └── sign-up-form.tsx            # Updated with Google
├── hooks/
│   ├── use-websocket.ts                # WS connection + auto-reconnect
│   ├── use-chat.ts                     # Chat state management
│   └── use-notifications.ts            # Notification state from WS
├── lib/
│   ├── api-client.ts                   # TanStack Query wrapper
│   └── ws-client.ts                    # WebSocket singleton + event emitter
```

### State Management

- **TanStack Query**: All REST API calls (groups CRUD, friend list, notifications, user profile, etc.)
- **Custom WebSocket hooks**: Real-time state (messages, typing, matchmaking status)
- **No extra state library**: React state + TanStack Query is sufficient

---

## Auth + Onboarding Flow

1. User visits `/login` → Google OAuth or Email/Password
2. Better Auth handles auth (Google via `socialProviders.google`)
3. On first login, `user.onboarded === false`
4. Redirect to `/onboarding`:
   - Gender: Male / Female / Other (always ask)
   - Country: attempt IP-based inference, let user override
5. Save profile, `onboarded = true`
6. Redirect to `/chat`

### Google OAuth Setup

- Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to server env
- Configure Better Auth `socialProviders: { google: { ... } }`
- Add Google sign-in button on frontend via `authClient.signIn.social({ provider: "google" })`

---

## Stripe Integration

### Flow

1. User clicks "Upgrade to Premium" on `/premium`
2. Frontend calls `POST /api/subscription/checkout` → returns Stripe Checkout URL
3. User completes payment on Stripe
4. Stripe webhook `POST /api/stripe/webhook` fires:
   - `checkout.session.completed` → create subscription, set `is_premium = true`
   - `customer.subscription.updated` → update status
   - `customer.subscription.deleted` → set `is_premium = false`
5. Frontend TanStack Query invalidates user data → UI updates

### Env Vars

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

---

## Anonymous Chat Rules

- No real names shown during anonymous chat. Server generates random anonymous names (e.g., "Blue Fox", "Red Panda").
- Messages are NOT stored in DB (ephemeral, WebSocket relay only).
- After chat ends, users can send friend requests.
- Once friends, real profiles are visible.
- Users can toggle `is_anonymous` in settings to control profile visibility in non-friend contexts.

---

## Notification System

### Types

- `friend_request`: "{name} sent you a friend request"
- `friend_accepted`: "{name} accepted your friend request"
- `group_invite`: "You were invited to {group_name}"

### Delivery

- Stored in `notification` table for persistence
- Pushed via WebSocket `notification:new` for real-time
- Sidebar bell icon shows unread count badge
- Mark as read via `PATCH /api/notifications/:id/read`

---

## Group Chat

### Public Groups

- Anyone can browse and join from `/chat/groups`
- Listed in a searchable directory
- REST API: `GET /api/groups?type=public`

### Private Groups

- Created with `type: private`
- Server generates a unique `invite_code` (8-char alphanumeric)
- Only joinable via code: `POST /api/groups/join` with `{ code }`
- Host can regenerate code

### Roles

- **Host**: full control (delete group, manage members, promote admins)
- **Admin**: can kick members
- **Member**: can chat

---

## Premium Features

| Feature | Free | Premium |
|---------|------|---------|
| Random matchmaking | Yes | Yes |
| Male → Female preference | No | Yes |
| Female → Female preference | No | Yes |
| Groups | Yes | Yes |
| Friends | Yes | Yes |
| Anonymous chat | Yes | Yes |
