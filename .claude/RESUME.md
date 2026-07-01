# RESUME — handoff snapshot (2026-07-01) — Ticker UX-polish program (post-redesign)

> For a fresh Delivery Conductor (`/conductor`). Overlay on the canon — WINS on current status.
> Self-contained against `PROJECT_CONTEXT.md`. The convexa-redesign shipped + merged to `main`
> (2026-06-30, commit `23c7501`, pushed). Since then: a **Ticker UX-polish program** on a stack of
> three feature branches — all committed + **pushed to origin**, none merged to `main` yet.

## Where we are
`main` = shipped redesign (live at convexa.pages.dev). New work = **stacked feature branches** (each
built on the previous, all pushed, unmerged):
1. **`ticker-microinteractions`** (`418315a`) — tasteful live motion on the Ticker page.
2. **`ticker-widgets`** (tip `75b967e`) — the shared `<Widget>` shell + bento board.
3. **`ticker-command-deck`** (tip `c481c38`, **HEAD**) — unified header/toolbar command deck.

Checked out: `ticker-command-deck`. Working tree clean. `apps/api` untouched across the whole stack
(all FE-only, `NO_BACKEND_CHANGE` → score/tier/`state_fingerprint` byte-identical).

## Done (this program — all verified: nx test green, tsc clean, lint 0 err, zero hex, conductor render pass on :4300)
- **ticker-microinteractions** (`418315a`): `useReducedMotion` + `useFlashOnChange` (+`flashColorSx`)
  hooks; live value-flash (LiveTape + header price/last-trade, gated `isLive && !streamOffline`);
  pulsing live dot; one-time staggered section reveal + skeleton crossfade; StatTile hover-lift; GEX
  mount-only bar-grow. (GEX live-line "glide" deferred — SVG x-attr animation unreliable.)
- **ticker-widgets** (`9c66d2e` shell → `cbd844a` premium well/chips → `a511a9a` term-chart fix →
  `75b967e` overlay polish): `Widget.tsx` shell + `WidgetSelectionContext`; all 8 sections wrapped
  (titles lifted into uniform headers); bento grid + inert "+ Add widget" slot. Cutting-edge, all
  feature-detected + reduced-motion-guarded + token-only: container queries, `:has()`, `color-mix()`
  off `--mui-*`, `@property` conic-gradient selected-ring, View Transitions expand/peek (Dialog
  fallback), content-visibility. `bodyVariant="inset"` recessed well + raised StatTile chips (fixes
  paper-on-paper). Affordance-only grip/⋮/add (honest coming-soon); expand is the only functional one.
- **ticker-command-deck** (`c481c38`): `CommandDeck.tsx` unifies TickerToolbar + TickerHeader +
  FreshnessLine into one chrome deck (top-lit gradient, control strip = one segmented instrument panel,
  folded freshness meta line, hand-off gradient into the board, sticky-condensed bar on scroll via
  IntersectionObserver). Shared `connectionChip()` so the sticky bar's price/chip are live-correct
  (freeze on SSE drop). Latest suite: **466/466**, 47 files.

## NEXT concrete step
**Consolidate + ship the stack.** Run a fresh **GATE Q** (de-correlated `qa-verify`) over the FULL stack
(`ticker-command-deck` tip = everything) vs the redesign invariants + the honesty/live-vs-static rules +
the mechanical gates (`nx test dashboard`, `tsc -p apps/dashboard/tsconfig.app.json --noEmit`,
`nx lint dashboard`, **`nx build @org/dashboard`**, `git diff --stat main...HEAD -- apps/api` = empty).
PASS → **merge `ticker-command-deck` → `main` (GATE S)** (it contains the whole stack) → push `main`.
Owner has approved each pass individually; this is the consolidation gate before merge.

## Then (backlog, not started)
- **Real widget functionality** — drag-reorder + resize + add/remove + per-widget config + persistence,
  hung on the `<Widget>` shell + `WidgetSelectionContext` seam (the affordances exist; wire them). The
  owner framed the widget shell explicitly as the seam for this.
- **Deferred Ticker UX quick wins** (BACKLOG §B "Ticker UX quick wins"): distance-to-level tiles
  (highest value), recent-ticker quick-pick chips, input ergonomics. (Big-number formatting + freshness
  line already shipped in the redesign.)
- **Business viability** (owner asked 2026-06-30, research done — plan file
  `C:\Users\rodri\.claude\plans\i-need-you-to-quizzical-widget.md` was overwritten by later widget/deck
  plans; the findings are in that conversation): 3 cheap de-risk actions before monetizing — (1) get
  Databento/ORATS commercial **derived-data redistribution** terms (current Massive/Polygon license
  forbids the redistribution the business needs); (2) securities-counsel consult on the AI-rec framing
  (impersonal/publisher's-exclusion); (3) a landing-page **waitlist demand test**. Freemium SaaS,
  serious-small-business ambition.

## Gotchas (learned this program — HARD-won)
- **The render pass is the gating step for visual/motion work.** Tests stay green while layout/paint
  regressions slip through — every real bug this program (term-chart-collapse, washed dialog, MUI-slot
  no-op, `:nth-child` warning) was caught ONLY by the conductor's live `:4300` render pass. Always
  render-verify (`preview_start dashboard` → :4300; drive via `preview_eval` computed styles — Ticker
  full-page screenshots hang, so read computed styles / scope to a selector). Stale-bundle: after a
  theme/`.ts` edit, a reload can race Vite — **stop+start the preview** to be sure.
- **MUI is v9.1.1**: the combined `containedPrimary` styleOverrides slot was DROPPED → target filled
  buttons via `root` + `ownerState`. `Dialog` uses `slots={{transition}}`/`slotProps`. Dark `Dialog`/
  `Paper` add an elevation wash → set `backgroundImage:'none'` + explicit bgcolor.
- **Emotion** flags `:nth-child` as SSR-unsafe (console spam) → use `:nth-of-type`.
- `sx`-array helper return types: let them infer (don't annotate `SxProps<Theme>` — it nests badly).
- Recharts `ResponsiveContainer height="100%"` needs a definite-height parent (flex chain / fixed height).
- **Lane reliability:** a `delivery-frontend` lane once stalled treating coordinator approval as
  insufficient (a stray plan-mode signal); the fix that works = spawn fresh with explicit "EXECUTE NOW —
  you are NOT in plan mode" framing. Lanes have no preview MCP → they verify statically; the conductor
  owns the render pass + the commit (lanes are told "do NOT commit").
- **Toolchain:** Bash needs `export PATH="/c/nvm4w/nodejs:$PATH"` before npx/nx; venv python
  `apps/api/.venv/Scripts/python.exe`; git commit via `git commit -F - <<'EOF'` (NOT a PowerShell
  here-string). `gh` at `C:\Users\rodri\tools\gh\bin\gh.exe`.
- **Invariants (HARD, every Ticker change):** `NO_BACKEND_CHANGE`; `[live-vs-static-isolation]` (motion/
  live values freeze on SSE drop, never animate/show a stale "live"); `prefers-reduced-motion` fallback;
  GPU-cheap; **theme tokens / `color-mix` off `--mui-*`, zero hardcoded hex**; `[no-real-order-path]`;
  coming-soon affordances read as coming-soon (never fake-functional). See [[convexa-redesign-spec-authority]].
