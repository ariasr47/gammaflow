# RESUME — handoff snapshot (2026-06-29) — CONVEXA-REDESIGN **RESTARTED** (implement-from-Figma)

> For a fresh Delivery Conductor (`/conductor`). Overlay on the canon — WINS on current status.
> **Supersedes** the prior "slice-by-slice re-skin" RESUME. The first redesign attempt was **abandoned
> and the branch reset** (owner decision 2026-06-29): we now rebuild the surfaces by having the build
> agents **implement from the Figma design system**, not hand-authored slice contracts.

## What changed (the restart)
- The 9 slice commits of the first attempt are **archived** at branch **`convexa-redesign-v1-archive`**
  (tip `3ecc432`) — nothing lost. `convexa-redesign` was **`git reset --hard main`** (→ `2828bfa`).
- **KEPT** (the design-system infra, re-applied as the fresh baseline, NOT a re-skin):
  - `apps/dashboard/src/app/tokens.ts` — single source of design tokens (mirrors the Figma variables).
  - `apps/dashboard/src/app/theme.ts` — consumes `tokens.ts` + **`cssVariables: true`** (emits `--mui-palette-*`). Tests green (full suite).
  - `scripts/sync-figma-tokens.mjs` — regenerate `tokens.ts` from Figma (REST [Enterprise], or `--from <json>`).
- **DROPPED** (will be re-implemented from Figma): the `ui/` primitives, the per-surface re-skins
  (positions/scanner/shell), the `/auth` page, AuthForm extraction. (All in the archive branch if needed.)

## The Figma design system (built this session, in the owner's file)
- File `Convexa — Web App (Design Reference)`, fileKey `4Njtm8QGWIgm4rA0UESg8n`. 70 variables (Dark+Light),
  13 styles, **17 components / 50 variants** (Button, Tile, StatusChip, MonoValue, Card, ComingSoonBox,
  ConvexityMotif, ValueCard, Chip, TextField, Tabs, PositionRow, Top-nav bar, Dialog, AuthModal,
  TradeEntryDialog, StateExportDrawer). See [[figma-design-system]].
- **Code Connect is NOT available** (account is Figma **Professional**; Code Connect needs Org/Enterprise).
  The substitute is **`.claude/contracts/convexa-redesign/FIGMA_COMPONENT_MAP.md`** — Figma node-id ⇄
  code component/file/props for every DS component. Agents read that + the README + `get_design_context`.

## How the new workflow runs (per surface)
1. Conductor authors a per-surface `FRONTEND_EXECUTION_CONTRACT.md` from `design_handoff_convexa_redesign/README.md`
   (behavior/copy/invariants authority — [[convexa-redesign-spec-authority]]) + the **FIGMA_COMPONENT_MAP** rows.
2. Spawn `delivery-frontend`: it inspects the Figma nodes via the MCP (`get_design_context`/`get_screenshot`),
   builds the surface with the mapped components, writes tests, runs `nx test dashboard` (no regression). DOES NOT commit.
3. Conductor renders/verifies (preview MCP), then commits on `convexa-redesign`.
4. After all surfaces: GATE Q (fresh de-correlated `qa-verify`) vs the README ACs + the 8 invariants, then merge to main (GATE S).

## NEXT
- Commit the fresh baseline (token/cssVariables infra + FIGMA_COMPONENT_MAP).
- Then implement surfaces (suggested order: Landing → Scanner → Positions → Ticker → Settings/Auth), one at a time, agents-from-Figma.

## Invariants (HARD — unchanged)
backend/scoring byte-identical (`NO_BACKEND_CHANGE`/`NO_INTERFACE_CHANGE`); live/stale/offline are STREAM-driven
(no "Connection (demo)" toggle); `no-real-order-path` (coming-soon inert, SIMULATED, Live tab zero-import lock);
`server-side-gate-enforcement` (gate wiring verbatim); `/_ops/metrics` off-shell; durable keys unchanged;
tooltips/honesty copy verbatim. Tokens come from `tokens.ts`/MUI — never hardcode a hex.

## Gotchas
- `gh` at `C:\Users\rodri\tools\gh\bin\gh.exe`; node via nvm — Bash needs `export PATH="/c/nvm4w/nodejs:$PATH"`;
  venv python `apps/api/.venv/Scripts/python.exe`. `nx test dashboard` to verify FE.
- Imported `Screens` page in Figma uses Windows system fonts (Cambria Math/MS PGothic/Segoe UI Emoji) that
  this env can't load → **don't reorder that page** via the plugin API (it throws); reorder only other pages.
- Untracked-on-disk (intentional): `design_handoff_convexa_redesign/`, `figma_frames/`.
