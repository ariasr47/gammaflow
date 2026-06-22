# BACKEND EXECUTION CONTRACT — Dark-pool block trades + isolation

> For the Backend Executioner (Session 4A). Binds to GAMMAFLOW_CONTEXT.md + INTERFACE_CONTRACT.md.
> Server work ONLY — no UI. Implement to spec; do not redesign or add features.

## Files / functions to modify
<!-- Exact targets, e.g.:
     - src/providers/base.py: add BlockPrint TypedDict; extend OffExchange with blocks
     - src/core/darkpool.py: detect blocks (off_exchange print, shares >= BLOCK_MIN_SHARES) in analyze_off_exchange
     - main.py: BLOCK_MIN_SHARES env; ensure dark-pool fetch is best-effort (try/except → off_exchange=None)
     - (signals.py only if blocks feed the capped confluence bonus) -->
- 

## Spec
<!-- Precise I/O for each change. Restate binding math/constraints it must honor:
     - off-exchange = trf_id present; recent-window only (DARKPOOL_LOOKBACK_SECONDS); no new fetch.
     - block = off_exchange print with shares >= threshold; notional = price*shares; ascending->blocks largest-notional first, top-N.
     - dark-pool computation MUST NOT be able to break the bundle: wrap, log, return None on failure;
       market_state + strike_profile remain intact. SSE code path untouched and independent. -->
- 

## Must emit (from INTERFACE_CONTRACT.md)
<!-- The exact off_exchange.blocks shape + presence rules. -->
- 

## Verification
<!-- How to prove it, e.g. curl with dark_pool=true shows blocks; a forced trade-fetch failure
     still returns a valid bundle (chart arrays present) with off_exchange omitted; dark_pool=false
     omits everything. -->
- [ ] 

## Out of scope
- No frontend. No endpoint shape changes beyond the interface contract. No gamma-math changes.
