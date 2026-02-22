# Design: Group Improvements, Sidebar Polish & Missing Pages

**Date:** 2026-02-22

---

## 1. Group Creation Dialog

Move group creation from separate page to a dialog on the groups list page. After creation, redirect to the new group's chat page.

## 2. Group Chat Avatars

Add avatars to message bubbles:
- Non-anonymous users: profile image or initials
- Anonymous users: generic incognito-style avatar
- Own messages: avatar on right; others: avatar on left

## 3. Sidebar Gender Matching

Replace single "Gender Chat" button with 4 separate premium-gated options:
- F → F Matching
- F → M Matching
- M → F Matching
- M → M Matching

Each sends the appropriate genderPreference directly. Show in collapsed sidebar with icons.

## 4. Group Settings Panel

Settings dialog accessible from group chat header:
- Member list with roles
- Kick member (host/admin)
- Ban member (host/admin) — new `group_ban` DB table
- Unban member (host/admin)
- Delete group (host only)
- Regenerate invite code (host only, private)

## 5. Message Ownership Fix

Compare `senderId` with current user ID when loading historical messages to correctly set `isOwn: true`.

## 6. Sidebar Collapsed Icons

Add icons to all NavPlatform items. Remove `group-data-[collapsible=icon]:hidden` so Platform section shows in collapsed mode. Use appropriate icons for each item.

## 7. Missing Pages & Polish

- Global not-found.tsx and error.tsx
- /chat/friends page
- Improve pricing page (currently placeholder)
- Improve home page
- Professional UI everywhere
