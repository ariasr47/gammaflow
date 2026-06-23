# INTERFACE CONTRACT — Trader Personas (persona-parametrized AI hand-off)

> The single source of FE↔BE integration truth. Both execution contracts bind to THIS file.
> Producer: Split Compressor (Session exit). Consumers: Backend + Frontend.
> Self-contained against `.claude/GAMMAFLOW_CONTEXT.md` + ARCHITECTURE_CONTRACT.md (A1
> RESOLVED·ACCEPTED). Persona is a **read-only, post-FREEZE prompt + presentation projection**: it
> may read the frozen bundle to fill prompt slots; it may **never** be an input to scoring/gate/
> fingerprint, and switching it triggers **no recompute**.

## The byte-identical guarantee (binding, the acceptance lens)
For a given request input, computing with persona = A, persona = B, or no persona yields
**byte-identical** `market_state`, `signals` (incl. `opportunity_score`, `opportunity_tier`), and
`ai_eval` (incl. `state_fingerprint`). **Only the assembled hand-off prompt differs.** Persona is
**not** a parameter to `signals` / `generate_signals` / `_opportunity_score` / `state_fingerprint` /
`evaluate_gate`.

## Assembly locus — PINNED: FE-RENDERED (Orchestrator @ GATE U·X, 2026-06-22)
- **Persona-parametrized hand-off (the one observable):** the user must be able to **view and copy**
  the persona-parametrized **entry** (`strategy_prompt`) and **reassessment** (`reassessment_prompt`)
  hand-off prompts. **Assembly is FE-rendered** — locus decision is final; the server-side-overlay
  alternative is dropped. Rationale: stateless server + client-local custom personas — the FE already
  holds the persona store, so assembling client-side avoids round-tripping custom definitions purely
  to render text.
  - **Backend ships the canonical decomposed template** for both prompts — FIXED section text + named
    PERSONA slot ids (the `fixed|persona` tagging) + the byte-identical Default rendering — plus the 7
    built-in `PersonaDefinition`s as read-only data. The backend assembles **no** per-persona text.
  - **FE assembles** the `handoff` projection (shape below) client-side from that decomposed template +
    the active persona + the current bundle.
- `GET /api/ticker/{ticker}` (+ slices) — **no change to any computed field; `meta` gains NO handoff
  projection** (no server overlay), and there is **no `?persona=` request parameter** (persona never
  reaches the server).
- `GET /api/stream/{ticker}` (SSE) — **UNCHANGED.** Persona touches no live path, adds no per-tick work.
- `GET /api/contract/{ticker}` (ghost-trade) — unchanged; the reassessment hand-off still assembles
  its `reassessment_request` as today, now with persona framing applied **FE-side** to the **system-prompt** text.

## Hand-off projection shape (FE-assembled, from the backend's decomposed template)
The product observable is a viewable/copyable prompt **with section tagging**, for both hand-offs. The
FE produces this client-side (locus PINNED FE-rendered) from the FIXED text + named PERSONA slot ids
the backend ships:
```jsonc
"handoff": {                          // read-only projection; present per the chosen locus
  "persona": { "id": "balanced_swinger" | null, "name": "Balanced Swinger" },  // null ⇒ Default
  "entry":         { "text": "…full strategy_prompt…",      "sections": [ { "id": "risk_floor", "kind": "fixed",   "label": "Risk-first floor" },
                                                                           { "id": "objective",  "kind": "persona", "label": "Objective framing" } ] },
  "reassessment":  { "text": "…full reassessment_prompt…",  "sections": [ /* same shape */ ] }
}
```
- `kind` ∈ `fixed | persona`. The FE badges `fixed` = "same under every persona", `persona` = the
  active persona's slot. **Default (no persona) ⇒ `text` is byte-identical to today's prompt**
  (greed line included; A1 relocation changes rendered text only when a persona is active).
- If assembly fails ⇒ the projection is the **default one-size prompt** (Default), **never an error**.

## PersonaDefinition (declarative data — no executable logic, no analytics params)
```jsonc
"PersonaDefinition": {
  "id": "string", "name": "string", "builtin": true, "version": 1,
  "objective": "income | directional_swing | hedging",
  "risk": "conservative | moderate | aggressive",
  "reassessment_lean": "string",          // declarative lean within the fixed schema/cap
  "emphasis_note": "string | null",        // bounded free-text; fills the framing slot ONLY
  "dte_pref": { "min_dte": 0, "max_dte": 0 } | null
}
```
- **Built-in presets** ship as read-only operator/built-in data: `Default (no persona)`,
  `Income Keeper`, `Premium Hunter`, `Steady Swinger`, `Balanced Swinger`, `Momentum Rider`,
  `The Protector` (objective/risk/leans per UX_BLUEPRINT §B).
- **Custom personas** are based on a preset with a bounded override set (risk level, reassessment
  lean, emphasis note) and persist **client-local**; the server stores none.
- **Active selection** is client-local: `active_persona_id | null` (`null` ⇒ Default).

## A1 disposition slot (binding text)
The trader-disposition characterization is a **persona-variable slot**, NOT part of the fixed floor:
`conservative` → `risk-averse; values capital preservation; benefits from imposed discipline (guard
against over-trading)`; `moderate` → `disciplined; balanced risk`; `aggressive` → `accepts higher
variance for higher reward`. The verbatim `prone to greed and poor risk management` appears **only**
in **Default** (verbatim) and the **conservative** register — never moderate/aggressive, never universal.

## FIXED vs PERSONA decomposition (both prompts — binding)
- **FIXED (persona cannot edit):** when-to-invoke / when-to-reassess (gate + dedupe); what-to-send
  (full bundle + `market_state_glossary.md` + DTE window — no field dropped); the output/verdict
  **schema**; the reassessment **Add cap / no-auto-apply / Roll constraint / `status` semantics**; the
  **universal risk-first floor** (lead with risk; `no_trade`/Hold valid; JSON-only; anchor `gex_spot`;
  reliability order; respect regime) — carrying **no** trader characterization.
- **PERSONA-VARIABLE:** objective framing · risk calibration · disposition characterization (A1) ·
  reassessment disposition lean · emphasis note · DTE-preference framing line. Slots fill **text
  only**; a hostile/odd customization cannot escape its slot to alter any FIXED section.

## Invariance readout (already in the bundle — consumed for the reassurance UX)
`signals.opportunity_score`, `signals.opportunity_tier`, `ai_eval.ready`, `ai_eval.changed`,
`ai_eval.state_fingerprint` — displayed as **"unchanged by persona."** No new fields required.

## DTE preference (convenience pre-fill only)
A persona `dte_pref` has **two bounded effects**: (1) a prompt-framing line; (2) a **convenience
pre-fill** of the request's existing `min_dte`/`max_dte` controls for the **next manual compute**
(visible, user-overridable, never auto-submitted). It **never** retro-mutates an already-computed
bundle, and **never** overrides a window the user already set. Switching persona triggers no recompute.

## Error / isolation semantics
- **Best-effort with default fallback:** unknown persona, malformed customization, or assembly failure
  → the **default one-size prompt** is used; never an HTTP error, never blocks the bundle/gate/hand-off.
- **No-op when absent:** a no-persona request is byte-identical to today (prompt included).
- **No LLM call** anywhere. **SSE untouched.** Persona writes to **no** scoring/gate/fingerprint field.
