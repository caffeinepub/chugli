# Specification

## Summary
**Goal:** Restore successful build/deployment for both backend and frontend, and remove admin-role/moderation functionality from the backend canister API.

**Planned changes:**
- Fix build and deployment errors so the backend canister and frontend assets compile cleanly and deploy without errors.
- Remove admin-role management and any admin-only moderation logic/endpoints from the Motoko backend API.
- If removing admin functionality requires backend state changes, add a safe conditional migration to preserve existing non-admin data (rooms, messages, mutes, blocks, reports, user profiles, counters).

**User-visible outcome:** The app deploys successfully with the frontend loading reliably; users can view rooms, enter a room, chat/send messages, and use existing non-admin features without runtime errors.
