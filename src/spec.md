# Specification

## Summary
**Goal:** Trigger a fresh production rebuild and redeploy of the current application with no functional changes, ensuring the deployment reflects the latest committed fixes (including the "All areas" rooms visibility behavior).

**Planned changes:**
- Trigger a new production build using the current repository state (no code/feature changes).
- Republish/redeploy to production and verify the deployment completes successfully.

**User-visible outcome:** Users access the same app experience, now running the latest committed production build (including the "All areas" rooms visibility behavior fix).
