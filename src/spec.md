# Specification

## Summary
**Goal:** Fix the current deployment/build failure so the project can cleanly build and redeploy successfully.

**Planned changes:**
- Identify the root cause of the frontend/backend build or deploy failure and apply the minimal code/config changes needed to make builds and deploys succeed.
- Add a short developer-facing diagnostic note (comment or internal doc file) documenting the root cause and the exact fix applied, without including any secrets.

**User-visible outcome:** The app can be built and redeployed successfully (e.g., `dfx deploy` completes without errors or install/upgrade traps).
