<instruction>
You are an expert full-stack software engineer and code reviewer. You are inspecting a WIP branch for the "City-Meet (城市社交氣象台)" project.
Please run `git status` and `git diff` to understand all recent changes. Analyze the workspace context, verify code quality, run all unit tests and builds, and ensure there are no regressions or runtime bugs according to the mission brief.
</instruction>

<workspace_context>
- **Project**: City-Meet (城市社交氣象台) - Real-time social heat cyclone visualizer map.
- **Tech Stack**: React 18, Vite, Leaflet + HTML5 Canvas (`CycloneEngine`), Express REST API, PostgreSQL 16 (Docker).
- **Recent Major Features & Bug Fixes**:
  1. **Taiwan Events Sync Pipeline**:
     - `server/sync-taiwan-events.js` & `src/api/eventsApi.js`: Fetches open data from Ministry of Culture (`cloud.culture.tw`). Validates Taiwan geographic coordinates (`lat 21.8~26.2, lng 119.2~122.5`), maps event categories, and sets clean initial state (`participantsCount = 0`, `arrivalStats = { departed: 0, onTheWay: 0, arrived: 0 }`, `moodParticles = []`).
     - `server/index.js`: Added `POST /api/admin/sync-events`, updated batch import SQL params to preserve `0` values without falling back to mock counts.
  2. **Map Style & Dynamic Viewport Linkage**:
     - `src/components/CycloneMap.jsx`: Google Maps vector tile layer integration with Day/Night toggle.
     - Viewport sync: `Sidebar.jsx` dynamically filters and ranks events visible within the current map viewport bounds.
  3. **Interaction & Crash Fixes**:
     - `src/components/CycloneCanvas.js` & `CycloneMap.jsx`: Restored Leaflet `map.on('click')` forwarding with nearest-neighbor hit detection.
     - `src/components/StormDetailModal.jsx`: Fixed unhandled `ReferenceError: totalReported is not defined` crash. Added defensive null-safety for `event.assemblyPoint`, `arrivalStats`, and `moodParticles`.
  4. **Strict Real Check-in Counters**:
     - Event check-in buttons (`我出發了`, `我快到了`, `已抵達現場`) strictly initialize at `0人` and only increment upon actual user interaction.
</workspace_context>

<mission_brief>
Please conduct a thorough inspection and verification of this branch:

1. **Verify Integrity & Tests**:
   - Run `npm test` and ensure all 59 unit tests in `tests/` pass with zero failures.
   - Run `npm run build` and ensure Vite compiles cleanly with zero warnings/errors.
   - Run `docker ps` to verify that `city-meet-db` and `city-meet-web` are running healthily.

2. **Code Quality & Edge Case Review**:
   - Inspect `src/components/StormDetailModal.jsx` and `src/components/BottomSheet.jsx` to ensure all property access on `event` (e.g. `arrivalStats`, `assemblyPoint`, `moodParticles`, `safetyTrust`) is 100% null-safe.
   - Check `src/utils/eventImporter.js` to ensure both manual JSON batch imports and automated sync pipelines respect `participantsCount` and `arrivalStats` defaults properly.
   - Inspect `server/index.js` and `server/sync-taiwan-events.js` for SQL injection safety and parameter validation.

3. **Runtime & Interaction Verification**:
   - Confirm clicking any cyclone on the map opens `StormDetailModal` smoothly without blank screen or uncaught errors.
   - Confirm status reporting buttons correctly update local state and send PATCH to `/api/events/:id/status`.
   - Provide a concise summary of findings, any potential edge cases discovered, and approval status.
</mission_brief>
