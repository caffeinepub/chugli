# Specification

## Summary
**Goal:** Add owner-only admin moderation tied to Internet Identity so only the app owner can delete rooms/messages and ban/unban users.

**Planned changes:**
- Backend: Introduce an immutable owner/admin principal set on first authenticated initialization; add an `isAdmin` query for the current caller.
- Backend: Add a persistent banned-principals list; reject banned principals from creating rooms or sending messages with clear English errors.
- Backend: Add admin-only endpoints to delete a room (including its messages and any room-keyed reports if present) and delete a message by (roomId, messageId).
- Backend: Extend the Message model to include `senderPrincipal`; add conditional migration/backfill so existing stored messages remain readable after upgrade.
- Frontend: Show admin-only controls (delete message, ban/unban sender, delete room with confirmation) only when the logged-in user is admin; keep all new UI strings in English.
- Frontend: Add React Query hooks/mutations for `isAdmin`, `deleteRoom`, `deleteMessage`, `banUser`, `unbanUser`, with cache invalidation so rooms/messages update immediately and navigation handles deleted rooms gracefully.

**User-visible outcome:** When logged in as the app owner via Internet Identity, you can delete rooms, delete individual messages, and ban/unban users from the UI; non-admin users never see these controls and cannot perform these actions.
