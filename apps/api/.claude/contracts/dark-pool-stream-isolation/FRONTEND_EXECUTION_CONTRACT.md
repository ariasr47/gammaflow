# FRONTEND EXECUTION CONTRACT — Dark-pool block trades + isolation

> For the Frontend Executioner (Session 4B). Binds to GAMMAFLOW_CONTEXT.md + INTERFACE_CONTRACT.md
> + the UX_BLUEPRINT component states. UI work ONLY — no server internals. Implement to spec.

## Files / components to modify
<!-- Exact targets, e.g.:
     - libs/api/src/lib/gammaflow.ts: add BlockPrint type; extend OffExchange with blocks
     - apps/dashboard/src/app/app.tsx: render block card(s); apply the Normal/Loading/Stream-Offline
       states to live-derived tiles; ensure the GEX chart + static stats keep rendering from the
       last bundle when the SSE stream is offline -->
- 

## Consumes (from INTERFACE_CONTRACT.md)
<!-- off_exchange.blocks shape + presence (only when dark_pool on); live.live / tick_age_s /
     market_session for offline detection. -->
- 

## Component states to implement (from UX_BLUEPRINT.md)
<!-- Normal / Loading / Stream Offline — exact appearance + which tiles each applies to. The
     static GEX chart and static stats MUST remain visible from cache in Stream Offline. -->
- 

## Degradation behavior (isolation)
<!-- A stream error degrades only live-derived tiles; never blank the chart or block the static view.
     Keep the last good bundle rendered; show the offline indicator on live tiles only. -->
- 

## Verification
<!-- e.g. kill the backend SSE: live tiles show "Stream Offline" while the GEX chart + static stats
     stay rendered; dark-pool blocks appear when toggle on; nothing blanks. -->
- [ ] 

## Out of scope
- No backend. No data-shape changes (bind to the interface contract). No new endpoints.

## Definition of done
- [ ] UI implemented to spec and verified (see Verification).
- [ ] `.claude/GAMMAFLOW_CONTEXT.md` refreshed if the UI changed the system's described
      behavior/state (re-read touched files; same section structure).
- [ ] This feature's `.claude/contracts/<feature>/` folder archived (it's shipped), and
      `.claude/OPEN_THREADS.md` updated for anything opened/closed. (Coordinate with backend so
      the folder is archived once both lanes land.)
- [ ] Committed.
