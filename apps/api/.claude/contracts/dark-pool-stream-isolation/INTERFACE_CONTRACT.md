# INTERFACE CONTRACT — Dark-pool block trades + live-stream isolation

> The single source of FE↔BE integration truth. Both execution contracts bind to THIS file.
> Producer: Split Compressor (Session 3 exit). Consumers: Backend (4A) + Frontend (4B).

## Endpoints touched
<!-- e.g. GET /api/ticker/{ticker} (+ /{ticker}) bundle; GET /api/stream/{ticker} SSE.
     List only what changes; include any new/changed query params (e.g. dark_pool, block thresholds). -->
- 

## Payload additions — bundle (`off_exchange`)
<!-- Exact field names, types, and PRESENCE rules (off_exchange present only when dark_pool=true). -->
```jsonc
"off_exchange": {
  "ratio_pct": 0.0,                 // number | null
  "offex_shares": 0, "total_shares": 0,
  "levels": [ { "price": 0, "shares": 0, "share_of_offex_pct": 0, "proximity_pct": 0 } ],
  "blocks": [ { "price": 0, "shares": 0, "notional": 0, "age_seconds": 0, "proximity_pct": 0 } ],
  "note": "string"
}
```
<!-- Confirm: blocks ordering (largest notional first), top-N count, and whether blocks affect
     opportunity_score (if so, reflected in signals.dark_pool_confluence). -->

## Live payload (SSE) — unchanged unless stated
<!-- Reaffirm the fields the FE uses for offline detection: live (bool), tick_age_s, market_session. -->
- 

## Error / stream semantics (the isolation contract)
<!-- The agreed signaling so FE can degrade without breaking the static view: -->
- Bundle endpoint failure modes: 404 (no chain); off_exchange omitted on best-effort failure
  (NOT an error) → chart/static stats still present.
- SSE: on disconnect the client must treat last bundle as authoritative; `live=false` /
  `market_session` drive the "Stream Offline" state. EventSource auto-reconnects.
- Rule: **no field the GEX chart depends on may come from the SSE stream.**
