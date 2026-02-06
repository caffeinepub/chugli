# Specification

## Summary
**Goal:** Restrict Rooms page search to exact matching by unique room ID and update UI copy to reflect ID-based searching.

**Planned changes:**
- Update Rooms filtering logic to match rooms only when `room.id` exactly equals the trimmed, non-empty applied search query; show all rooms when the trimmed query is empty.
- Update the Rooms search dialog description and input placeholder to explicitly request a room ID (unique ID), not a room name.
- Update the Rooms “no results” empty-state messaging for non-empty searches to indicate no room was found for the entered ID; keep the existing behavior when there is no search query.

**User-visible outcome:** Users can search Rooms only by entering an exact room ID; searching by room name no longer returns results, and “no results” messaging clearly references the entered room ID.
