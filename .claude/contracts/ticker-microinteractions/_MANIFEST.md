# ticker-microinteractions — pipeline manifest
Entry:        owner-directed (GATE V motion/polish fast-path; no PM/UX/architect)
Stage:        GATE V — ✅ DONE (conductor-built inline after the lane stalled in plan-mode confusion). 6 of 7 interactions shipped: value flash-on-tick (LiveTape + header price/last-trade, live-gated), live-dot pulse, one-time staggered section reveal, tile hover lift + smooth offline transition, GEX mount-only bar-grow, skeleton→content crossfade. DEFERRED: GEX live-line "glide" (animating SVG line x-attributes is unreliable/janky — not shipped). New shared hooks `useReducedMotion` + `useFlashOnChange` (+ specs). Verified: nx test dashboard green (+ hook specs), tsc clean, lint 0 err, zero hex, apps/api untouched; render pass on :4300 (loads, hover transition, dot static when not-live = correct gating, console clean).
Branch:       ticker-microinteractions (off main @ the convexa-redesign merge)
Repos:        frontend (NO_BACKEND_CHANGE — apps/api untouched)
Brief:        n/a (owner-directed; this contract is the spec)
Contracts:
  - ARCHITECTURE_CONTRACT.md   n/a (presentation-only)
  - PRODUCT_CONTRACT.md        n/a
  - UX_BLUEPRINT.md            n/a (this FE contract is the blueprint)
  - INTERFACE_CONTRACT.md      n/a (NO_INTERFACE_CHANGE — consumes existing bundle/SSE unchanged)
  - BACKEND_EXECUTION_CONTRACT.md   NO_BACKEND_CHANGE
  - FRONTEND_EXECUTION_CONTRACT.md  draft — Ticker micro/mini-interactions + polish (motion-only)
Open amendments: none
QA (GATE Q):  n/a until build lands; single render + suite verification before commit
Last gateway:  GATE V @ 2026-06-30 — owner-directed motion polish
