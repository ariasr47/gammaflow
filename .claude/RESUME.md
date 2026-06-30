# RESUME — handoff snapshot (2026-06-30) — CONVEXA-REDESIGN: Ticker surface re-skinned (code) + committed

> For a fresh Delivery Conductor (`/conductor`). Overlay on the canon — WINS on current status.
> **Supersedes** the 2026-06-29 RESUME (Landing/Settings/Auth handoff): those + Scanner + Positions are
> shipped/committed; the **Ticker** surface is now re-skinned in code on `convexa-redesign` (this session).
> Self-contained against `PROJECT_CONTEXT.md` + `BACKLOG.md` §B.

## Where we are
`convexa-redesign` is mid-pipeline — the full FE re-skin to the Figma dark-fintech DS (implement-from-Figma).
**Surfaces:** Landing ✅ · Settings/Auth ✅ · Scanner ✅ · Positions ✅ · **Ticker ✅ (this session, code re-skin)** ·
full-page **`/auth`** route ⬜ (not started). After `/auth`: a fresh QA pass, then merge to `main` (GATE S).

## This session (2026-06-30) — Ticker surface re-skin (committed on `convexa-redesign`)
- **`e4a8eff`** — Ticker re-skin: `TickerDashboard` → `ticker/sections/*` (Toolbar, Header, LiveTape,
  DealerPositioning, GexStrikeProfile, TermStructure, FreshPositioning, OffExchangeBlocks, Setups, StatTile,
  TintChip) + AI-rec panel re-skin (signed-in + signed-out states).
- **`32d4027`** — layout/UX: Fresh ∥ Off-exchange side-by-side equal-height row; "+ Open simulated trade"
  moved to a persistent right-aligned **header** CTA (out of the analysis flow).
- **Design facts to KEEP (don't "fix" as Figma drift):** section titles use DS **Inter Semi Bold 16** via a
  global `theme.h6`; **GEX is a VERTICAL diverging bar chart** (owner UX call — NOT the horizontal Figma
  `149:172`); Term ↔ AI-rec side-by-side equal height; **connection status + regime chips live in the header**
  (not the toolbar); the AI-rec **hand-off viewer** and the ticker **portfolio/ghost-trade panels were removed**
  (owner). `nx test dashboard` **412/412**, lint clean.

## Theme / design system (this session)
- **Foundations (design file `4Njtm8QGWIgm4rA0UESg8n`) expanded to the FULL MUI palette** (76 color vars,
  Dark/Light: each channel main/dark/light/contrastText/_states + secondary(violet) + action + common;
  off-white `color/text/primary`=#E6EDF3). The **MUI kit (`eJ9qzhA6rNxwk2KVQA9AvU`) `palette/*` now ALIASES
  Foundations** (single source of truth). ~113 junk `localhost/*` text styles deleted. Recipes/IDs in
  `.claude/contracts/convexa-redesign/THEME_TOKENS.md` (NOTE: that doc still describes the pre-expansion state
  — updating it is a pending follow-up).
- Code theme (`apps/dashboard/src/app/theme.ts` + `tokens.ts`) is MUI-native and matches the DS.

## Branch / git
- Branch **`convexa-redesign`** (off `main`). Latest commit **`32d4027`**. **NOT pushed.** Working tree clean.
- Earlier surfaces committed: Landing/Settings/Auth `0353758`, Scanner `fbb1e2d`, Positions `9336856`(+`ab52759`).

## NEXT — pending follow-ups (full detail: `BACKLOG.md` §B "Convexa-redesign — finish the FE re-skin program")
1. **OWNER UI (can't be scripted):** in the design file **Publish** the MUI kit → **Update** the kit library in
   the design file → set the `Screens - *` frames to the kit's **dark** mode. (Until then MUI-kit instances on
   the screens don't inherit the brand theme.)
2. **Token-binding retrofit + cleanup (code):** bind the remaining ticker/shell components to Foundations
   `color/*` + `Type/*` per `THEME_TOKENS.md` (Toolbar is the done template); **remove the now-dead
   `HandoffDialog`** in `apps/dashboard/src/app/personas/components.tsx`; **update `THEME_TOKENS.md`** to record
   the expanded Foundations + kit aliasing; **QA the global `theme.h6` 16/600** change for section-title
   regressions on Positions/Settings/Landing.
3. **Remaining surface + ship:** the full-page **`/auth`** route (reuse the `AuthDialog` form); a fresh **QA
   pass** vs `design_handoff_convexa_redesign/README.md` ACs + the 8 invariants; **merge `convexa-redesign` →
   `main`** (GATE S). Optionally push the branch / open a PR.

## Gotchas
- **Preview:** `.claude/launch.json` `dashboard` on **:4300** (drive via the Claude_Preview MCP —
  `preview_start dashboard`). **Ticker-page screenshots can hang** (SSE+charts) → prefer `preview_eval` /
  `preview_snapshot`; if a screenshot times out, **stop + start** the preview server. Dev session is signed in
  (razorstick@gmail.com) — to see the AI-rec **signed-out** state, rely on `gated-ai-rec.spec` (signing out in
  the dev session isn't straightforward).
- **Bash:** `export PATH="/c/nvm4w/nodejs:$PATH"` before npx/nx; `gh` at `C:\Users\rodri\tools\gh\bin\gh.exe`;
  venv python `apps/api/.venv/Scripts/python.exe`. **git commit messages:** use Bash `git commit -F - <<'EOF'`
  — do NOT use a PowerShell here-string (`@'…'@`) in the Bash tool (it leaks a literal `@` into the message).
- **Figma:** MCP server `mcp__35016a31-…__*` (`use_figma` / `get_screenshot` / `get_metadata`); load the
  `figma-use` skill before `use_figma`. Ticker screen = node `135:3`; section components on `Ticker · …` pages.
- **Invariants (HARD):** backend/score `state_fingerprint` byte-identical (NO_BACKEND_CHANGE); connection is
  **stream-driven** (no "Connection (demo)" toggle — built as a read-only status indicator);
  `[no-real-order-path]`; `[live-vs-static-isolation]`; tokens via `tokens.ts`/MUI (no hardcoded hex). See
  [[convexa-redesign-spec-authority]].
