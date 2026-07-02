# RESUME — handoff snapshot (2026-07-01, late) — Owner 5-item product program

> For a fresh Delivery Conductor (`/conductor`). Overlay on the canon — WINS on current status.
> `main` @ `073f594`, pushed, tree clean except any lane output landing after this snapshot.

## The program (owner directive 2026-07-01, recorded in BACKLOG "Last GATE I — 2026-07-01")
1. **`light-mode-parity`** — ✅ SHIPPED (`8abae03`): mode-aware `extras` via `extrasFor(theme)`
   (tokens.ts), ONE shared `hatchBackgroundImage` (ComingSoonBox; Scanner + LiveTabPanel reuse),
   panelRaised call sites themed (both dialogs, positions pills/group headers), mode-aware ticker
   chrome (StatTile/CommandDeck/TickerToolbar/Widget). Dark verified byte-identical; light verified
   on :4300 (landing/scanner/positions/ticker). 486/486, tsc/lint/build green.
2+3. **`sim-entry-unification`** — ✅ SHIPPED (`d704193`, pushed): ONE shared
   `app/trading/TradeEntryDialog.tsx` on both pages (7 specs migrated + 6 new incl. the two flow
   tests); deleted ghost-trade/TradeEntryDialog + positions/PositionEntryDialog + GhostTradePanel +
   app.module.css (zero-importer proven); `app/README.md` map added. Conductor re-ran gates
   (tsc/492/lint/build) + render pass (same testid both pages; anonymous gate correct; light surface
   via extrasFor). Manifest updated. Folder ready to archive at the program's GATE S.
4. **`ai-rec-backtest-orders`** — ARCHITECTURE + PRODUCT ✅ LOCKED (committed `3eb0f8a`; lint clean).
   Shape: client-local durable `convexa.orders.v1` SimOrder store (waiting→triggered→filled/cancelled/
   expired, good-til, rec→order→position provenance); v1 trigger = underlying_above|below on live NBBO
   mid ONLY; backend `ScenarioLLMProvider` (deterministic, keyless, default-OFF env flag). PM answered
   all ten §12 questions (D1–D10; Orders on BOTH pages; honest "waiting for live data" coverage state);
   48 ACs. **GATE U·X ✅ DONE** (`68fc23b`, lint clean): UX_BLUEPRINT + INTERFACE (purely additive on
   the 2 existing ai-rec endpoints — `scenario_id?`/`scenario?`/`RecStatus.scenarios` always-present,
   flag `AI_REC_SCENARIOS_ENABLED` default OFF, refusals `scenario_unavailable`/`scenario_error`; NO
   order endpoints) + standalone spec `.claude/tools/conformance/ai_rec_backtest_orders.json` +
   BACKEND (`ai_scenarios.py` + 9-scenario registry, 9 runtime proofs) + FRONTEND (`orders/` module,
   `convexa.orders.v1`, pure live-cross engine, Act flow via an additive order variant of
   `trading/TradeEntryDialog`, AC→named-test floor) all LOCKED.
   **NEXT (the fresh session's first move):** dispatch BOTH executioner lanes IN PARALLEL off their
   execution contracts (fresh `delivery-backend` + `delivery-frontend` subagents; "EXECUTE NOW — you
   are NOT in plan mode" framing; no commits; each reports files + gate outputs) → conductor verifies
   (nx test dashboard [baseline 492] · tsc · lint · build · backend boot + `interface_conformance.py
   --contract .claude/contracts/ai-rec-backtest-orders/INTERFACE_CONTRACT.md --url
   http://127.0.0.1:8000` · score/tier/fingerprint byte-identity) → GATE Q on a fresh de-correlated
   qa-verify (different model, e.g. sonnet; AC↔test traceability over the 48 ACs) → conductor render
   pass (both pages, both themes, flag OFF default + ON scenario picker) → commit/push → GATE S
   (archive light-mode-parity[no folder—note only]/sim-entry-unification/ai-rec-backtest-orders;
   ledger rows; then `scanner` opens with its BRIEF → architect).
5. **`scanner`** — BRIEF written (`.claude/contracts/scanner/BRIEF.md`), queued after 4.
   Architect must re-justify the locked single-ticker decision with a perf design.

## When the sim-entry-unification lane reports (the immediate next step)
1. Read its report (files changed/deleted + proofs + gate outputs). Bounce anything out-of-contract.
2. Conductor gates: `npx nx test dashboard` (baseline 486; new named tests required per contract),
   `npx tsc -p apps/dashboard/tsconfig.app.json --noEmit`, `npx nx lint dashboard`,
   `npx nx build @org/dashboard`.
3. **Render pass (conductor-owned, :4300 via preview_start "dashboard"; backend usually already on
   :8000):** BOTH pages open the SAME dialog — Ticker `/ticker/TSLA` "+ Open simulated trade" AND
   Positions `/positions` "+ Open simulated position" (needs sign-in for the gate? anonymous shows
   SignInPrompt — verify the gate prompt appears anonymous + the dialog appears signed-in via the
   demo account: backend env `SEED_TEST_ACCOUNT=1` seeds demo@convexa.io / convexa-test-2026);
   check BOTH themes (localStorage `convexa.uiprefs.v1` → {"schema_version":1,"theme":"light"|"dark",
   "default_ticker":null}); console error-free.
4. Commit to main + push (owner-approved pattern this session), update the manifest (QA line), then
   proceed to item 4's PM stage once the architect contract is in (PM → UX → fan-out per ORCHESTRATOR).

## When the ai-rec-backtest-orders architect reports
Gate-check it (`apps/api/.venv/Scripts/python.exe .claude/tools/contract_lint.py ai-rec-backtest-orders`),
then route to PM (`ROLE_LAUNCH_PROMPTS.md` §2) — product scope on the architect's skeleton. Then UX →
GATE U·X split → both executioner lanes → GATE Q (fresh de-correlated qa-verify, different model) → GATE S.

## Gotchas (this session — beyond the standing ones in the prior RESUME/threads)
- `extras` is now mode-aware: bare `extras.` = dark-only (theme.ts only); components MUST use
  `extrasFor(theme)` inside sx callbacks. tsc catches literal-type drift (widen with
  `Record<keyof typeof extras, string>`).
- Direct `npx vitest run <file>` fails on a react-transition-group ESM directory-import quirk — ALWAYS
  run via `npx nx test dashboard`.
- Beware masked exit codes in Bash pipelines (`tsc | tail && echo OK` prints OK on failure) — check
  `$?` or run tsc bare.
- The QA catch-up earlier today (`11e8ec3`): §3 stagger regression fixed via Widget `revealIndex` →
  `--widget-reveal-delay`; ticker sections live in `ticker/widgets/` (renamed from `sections/`).
- Owner git preference this session: commit to `main` + push after gates pass (no feature branches).
- CI/CD not wired — pushes do NOT auto-deploy convexa.pages.dev; live deploy stays owner-applied.

## Standing invariants for EVERY item in this program
`no-real-order-path` (everything SIMULATED; orders = bookkeeping + confirm; scanner = display/links),
`server-side-gate-enforcement` (sim-trade writes + batch recs gated), `additive-keeps-score-byte-identical`
(nothing here feeds scoring), `best-effort-isolated-or-null`, `live-vs-static-isolation` (triggers/limits
fire on LIVE crosses only), theme tokens via `extrasFor`/palette — zero hardcoded hex.
