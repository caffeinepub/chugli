# Specification

## Summary
**Goal:** Allow any user who knows a room’s password to delete that room, without requiring an admin Internet Identity.

**Planned changes:**
- Update backend room creation to accept and persist a room password (not exposed via room query/list endpoints).
- Replace admin-identity-gated room deletion with a password-based delete method that accepts (roomId, password), validates the password, and performs the same cleanup (room, messages, reports).
- Add clear backend error responses for “room not found” and “invalid password” cases.
- Update frontend room creation UI to collect a non-empty room password and send it to the backend.
- Update all frontend room deletion entry points (in-room controls, room list actions menu, admin moderation room panel) to prompt for the room password and call the new password-based deletion API.
- Update/introduce React Query hooks for password-based room deletion and ensure the same caches are invalidated as before; keep other admin-only actions unchanged.

**User-visible outcome:** Users can create rooms with a password and later delete a room from the UI by entering the correct room password; deletion errors clearly explain whether the password is wrong or the room no longer exists.
