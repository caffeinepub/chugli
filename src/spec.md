# Specification

## Summary
**Goal:** Allow any user (including anonymous) to unlock backend admin privileges using a shared password, and align frontend/backend password flows so admin and password-protected room deletion work consistently without requiring an admin Internet Identity account.

**Planned changes:**
- Backend: add a shared method that accepts the shared admin password and, when correct, records/grants admin privileges for the caller principal for subsequent admin-only operations.
- Backend: ensure the same shared password is used for both admin privilege escalation and deleteRoom(password) validation.
- Frontend: update admin gating so admin actions depend on the UI password unlock state plus backend-confirmed admin status (not Internet Identity login alone).
- Frontend: trigger the backend admin-granting call immediately after successful password entry so subsequent admin-only calls pass backend authorization.
- Frontend: revise Admin page copy/alerts to reflect password-based admin access and remove messaging that implies an admin Internet Identity account is required (English text only).

**User-visible outcome:** Users can enter the admin password to unlock moderation features (e.g., delete messages/rooms, ban/unban, check bans) even without logging in via Internet Identity, and the same password works consistently for admin unlock and password-protected room deletion.
