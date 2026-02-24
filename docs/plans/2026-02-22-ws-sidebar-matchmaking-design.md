# Design: WebSocket Fix, Sidebar Improvements & Country Matchmaking

**Date:** 2026-02-22

---

## 1. WebSocket `ws.data` Bug Fix

**Problem:** In `apps/server/src/ws/index.ts`, the `userData` object is created in the `upgradeWebSocket` closure but never attached to `ws.data`. Hono's WebSocket adapter wraps Bun's `ServerWebSocket`, so `ws.data` is `null`. When `handleWsMessage` destructures `ws.data` at line 23, it throws `TypeError: Cannot destructure property 'userId' from null`.

**Fix:** Pass `userData` directly to `handleWsMessage` and `handleWsClose` as a parameter instead of relying on `ws.data`.

- `ws/index.ts`: Pass `userData` to `handleWsMessage(ws, raw, userData)` in `onMessage`
- `ws/message-handler.ts`: Change signature to `handleWsMessage(ws, raw, userData)`, destructure from `userData` param instead of `ws.data`
- `ws/connection-manager.ts`: Also add `country` to `WsUserData` interface for matchmaking
- `ws/index.ts`: Extract `country` from session alongside `gender` and `isPremium`

---

## 2. Sidebar UI Improvements

### 2a. Remove Settings from NavPlatform
Settings is already in NavUser dropdown. Remove the Settings button from `nav-platform.tsx`.

### 2b. Add Gender Preferences Chat button
Replace "Chat Anonymously" with a unified entry. Add a second "Gender Chat" button:
- If user is premium: navigate to `/chat/anonymously?genderPref=true`
- If user is not premium: redirect to `/pricing`
- NavPlatform needs to know `isPremium` - fetch via `useProfile()` hook

### 2c. Fetch real user data in sidebar
Currently `app-sidebar.tsx` passes hardcoded user data (`shadcn`, `m@example.com`). Fetch real user via `useProfile()` hook and pass to `NavUser`.

### 2d. Make Support & Feedback functional
- Change placeholder URLs from `"#"` to `/support` and `/feedback`
- Create two new pages under `(base)` route group:
  - `/support/page.tsx` - form with subject + message, POSTs to `/api/support`
  - `/feedback/page.tsx` - form with rating + message, POSTs to `/api/feedback`
- Create backend endpoints to receive and store submissions
- Backend: new `support` module with controller, service, routes
- DB: new `support_ticket` and `feedback` tables

---

## 3. Country Selection with restcountries.com API

### 3a. Shared `useCountries()` hook
- Fetch from `https://restcountries.com/v3.1/all?fields=name,cca2,flags`
- Cache with React Query (staleTime: 24h since country list rarely changes)
- Returns `{ countries, isLoading }` where each country has `{ name, code, flagUrl }`
- Sort alphabetically by name

### 3b. Country Selector component
- Reusable `CountrySelector` component with search/filter
- Shows flag image + country name for each option
- Used in: onboarding, settings, matchmaking screen

### 3c. Update Onboarding page
- Replace free-text country input with `CountrySelector`
- Store ISO alpha-2 code (e.g., "US") instead of free text

### 3d. Update Settings page
- Replace free-text country input with `CountrySelector`

### 3e. Country-based Matchmaking

**Frontend:**
- Add country preference selector to matchmaking idle screen
- Default to user's own country from profile
- Allow selecting "Any Country" or a specific country
- Send `countryPreference` in `matchmaking:join` message

**Backend queue strategy:**
- Queue keys become: `matchmaking:queue:random`, `matchmaking:queue:country:{code}`, `matchmaking:queue:gender:{pref}`, `matchmaking:queue:country:{code}:gender:{pref}`
- `matchmaking.service.ts`: Update `joinQueue` to accept `countryPreference` and build queue key accordingly
- `matchmaking.controller.ts`: Accept `countryPreference` param, no premium gate for country
- `message-handler.ts`: Pass `countryPreference` from WS message to controller
- `use-chat.ts`: Send `countryPreference` in `startSearch`

### 3f. QueueEntry update
Add `country` field to `QueueEntry` interface.

---

## 4. Files to Create

| File | Purpose |
|------|---------|
| `apps/web/src/hooks/use-countries.ts` | Shared hook fetching restcountries.com |
| `apps/web/src/components/country-selector.tsx` | Reusable country dropdown with flags |
| `apps/web/src/app/(base)/support/page.tsx` | Support form page |
| `apps/web/src/app/(base)/feedback/page.tsx` | Feedback form page |
| `apps/server/src/modules/support/` | Support module (controller, service, routes) |

## 5. Files to Modify

| File | Changes |
|------|---------|
| `apps/server/src/ws/index.ts` | Pass userData to handlers, add country |
| `apps/server/src/ws/message-handler.ts` | Accept userData param, pass countryPreference |
| `apps/server/src/ws/connection-manager.ts` | Add country to WsUserData |
| `apps/server/src/modules/matchmaking/matchmaking.service.ts` | Country-based queue keys |
| `apps/server/src/modules/matchmaking/matchmaking.controller.ts` | Accept countryPreference |
| `apps/web/src/components/sidebar/app-sidebar.tsx` | Fetch real user, update URLs |
| `apps/web/src/components/sidebar/nav-platform.tsx` | Remove Settings, add Gender Chat |
| `apps/web/src/components/sidebar/nav-user.tsx` | Accept real user data |
| `apps/web/src/components/chat/matchmaking-screen.tsx` | Add country selector |
| `apps/web/src/hooks/use-chat.ts` | Send countryPreference |
| `apps/web/src/app/(base)/onboarding/page.tsx` | Use CountrySelector |
| `apps/web/src/app/(chat)/chat/settings/page.tsx` | Use CountrySelector |
| `packages/db/src/schema/` | Add support_ticket and feedback tables |
