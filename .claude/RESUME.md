# RESUME — handoff snapshot (2026-06-29, late) — CONVEXA-REDESIGN: Landing + Settings/Auth SHIPPED

> For a fresh Delivery Conductor (`/conductor`). Overlay on the canon — WINS on current status.
> **Supersedes** the earlier "RESTARTED / implement-from-Figma" RESUME: that restart is done and the
> first two surfaces are built, verified, and committed. Self-contained against PROJECT_CONTEXT.md.

## Where we are
`convexa-redesign` is mid-pipeline — a full FE re-skin to the Figma dark-fintech system, done
**implement-from-Figma** (build agents implement each surface from the Figma DS via the component map).
**Landing ✅ and Settings/Auth ✅ are built, verified (preview MCP), and committed.** Remaining surfaces:
**Scanner · Positions · Ticker**, plus the new full-page **`/auth`** route. `NO_BACKEND_CHANGE` throughout.

## Branch / git state
- Branch **`convexa-redesign`** (off `main` @ `2828bfa`). Two commits, **NOT pushed**:
  - `1862ee1` — MUI theme/token bridge + DS infra (tokens.ts, theme.ts cssVariables, sync script, FIGMA_COMPONENT_MAP).
  - `0353758` — Landing + Settings/Auth surfaces, global nav, Figma auth modal.
- First (slice-by-slice) attempt is archived at branch **`convexa-redesign-v1-archive`** (`3ecc432`) — recoverable.
- Working tree clean. Merge to `main` at GATE S (after all surfaces + a fresh QA pass).

## Done + committed (this redesign so far)
- **Theme/token bridge:** `apps/dashboard/src/app/tokens.ts` is the single token source → `theme.ts`
  consumes it with **`cssVariables: true`** (emits `--mui-palette-*`). Aligned to the Figma DS: `info`
  (cyan), `warning` (amber), text greys `#8b949e`/`#5b6675`, off-white primary `#e6edf3`. Figma variable
  code-syntax re-pointed to `--mui-palette-*`. `scripts/sync-figma-tokens.mjs` regenerates tokens (REST
  needs Enterprise; `--from <json>` works on Pro).
- **Global nav:** Landing now renders INSIDE `AppShell` (nav on every surface; `/_ops/metrics` the only
  nav-less route — operator separation). Owner GATE-Z override of the README "Landing outside shell"
  line; recorded in `app.tsx` docstring.
- **`shell/TopNav.tsx`** — the nav bar extracted as its own component (AppShell = layout only): frosted/
  translucent sticky bar, 1240 content column, active-item glow.
- **`auth/AccountControl.tsx`** — signed-out = custom **Log in (ghost) + Sign up (gradient pill)** opening
  the auth modal; signed-in = email + **32px gradient avatar → `/settings`** (no dropdown; logout moved to
  Settings). Shared `auth/avatar.ts` helper.
- **Auth modal (`auth/AuthDialog.tsx` + `GoogleButton.tsx`)** re-skinned to the Figma: uppercase EMAIL/
  PASSWORD labels, elevated card (`#1c2330`), white multicolor "Continue with Google", "Welcome back".
  Security floor + testids preserved; modal is email+password (display-name lives on the future `/auth`).
- **Settings/Auth surface (`auth/SettingsPage.tsx` + `AiKeySection.tsx`)** per Figma `4:2572`: ~640 column,
  Account / AI key / Preferences panels, **spaced segmented theme control**, mono masked key.
- **Landing (`landing/Landing.tsx`)** re-skinned + composed from reusable `ui/` components:
  `ConvexityMotif`, `ValueCard` (hover polish), `ComingSoonCard` (Lock/Radar icons), `Jargon`.
- **Cleanup:** removed dead `AUTH_COPY.account.settings`/`logOut`. `nx test dashboard` **344/344**, lint+build clean.

## The Figma design system (built earlier this session)
File **"Convexa — Web App (Design Reference)"**, fileKey **`4Njtm8QGWIgm4rA0UESg8n`**. 70 variables
(Dark+Light), 13 styles, **17 components / 50 variants**. See [[figma-design-system]].
**Code Connect is unavailable (account is Figma Professional → needs Org/Enterprise).** The substitute is
**`.claude/contracts/convexa-redesign/FIGMA_COMPONENT_MAP.md`** — node-id ⇄ code component/file/props for
every DS component. Two Figma MCP servers are connected: `mcp__35016a31-…__*` (used so far) and a
first-party `mcp__Figma__*`.

## Per-surface workflow (the established loop)
1. Conductor **inspects the Figma frame** via the MCP (`get_screenshot`/`get_design_context`/`get_variable_defs`)
   and authors `.claude/contracts/convexa-redesign/FRONTEND_EXECUTION_CONTRACT.md` (OVERWRITE per surface)
   from `design_handoff_convexa_redesign/README.md` + the FIGMA_COMPONENT_MAP. Run `contract_lint.py` (green).
2. Spawn **`delivery-frontend`** (Agent, `run_in_background`) bound to it. **The lane has NO live Figma
   access** — the conductor must carry the visual/structural detail into the contract. Lane builds, writes
   tests, runs `nx test dashboard`, does NOT commit.
3. **Conductor renders/verifies** via the **Claude_Preview MCP** (build agents can't render), then commits.
4. After ALL surfaces: fresh `qa-verify` (de-correlated) vs README ACs + the 8 invariants, then merge to main.

## NEXT
- Suggested order: **Scanner** (smallest — honest coming-soon, zero network; reuse `ComingSoonCard`) →
  **Positions** → **Ticker** (largest, most invariant-dense) → full-page **`/auth`** (reuse the AuthDialog form).
- **Flagged decision:** masked-key format — shipped `Key set ···· 4f9c` vs the Figma mock `sk-ant-···· 4f9c`.
  Changing it touches the byo-ai-key AC copy (`maskedKeyLabel`) + its tests. Owner to decide; not done.
- Optional: push the branch / open a PR.

## Invariants (HARD — PROJECT_CONTEXT §5)
backend/scoring byte-identical (`NO_BACKEND_CHANGE`); live/stale/offline stream-driven (no "Connection
demo" toggle); `no-real-order-path` (coming-soon inert, SIMULATED, Live tab zero-import lock);
`server-side-gate-enforcement` (gate wiring verbatim); `/_ops/metrics` off-shell; durable keys unchanged;
tooltips/honesty copy verbatim. Tokens via `tokens.ts`/MUI — never hardcode a hex (avatar gradient + the
hatch/glow `sx` literals are the documented exceptions). See [[convexa-redesign-spec-authority]].

## Gotchas
- **Preview:** `.claude/launch.json` has a `dashboard` config on **:4300** (`nx serve dashboard --port 4300`)
  — :4200 was already occupied by another dev server. Drive it via the Claude_Preview MCP (`preview_start
  dashboard`). Screenshots work for Landing/Settings (static); the Ticker page may time out (SSE+recharts) —
  use `preview_snapshot`/`preview_eval` there.
- A backend is running (`/api/auth/session` 200); the dev session is signed in as **razorstick@gmail.com**
  (no display name, no AI key) — so Settings shows the signed-in/no-key state.
- `gh` at `C:\Users\rodri\tools\gh\bin\gh.exe`; node via nvm — Bash needs `export PATH="/c/nvm4w/nodejs:$PATH"`;
  venv python `apps/api/.venv/Scripts/python.exe`; `contract_lint.py convexa-redesign` before each dispatch.
- The imported Figma **`Screens`** page uses Windows system fonts this env can't load → **don't reorder that
  page** via the plugin API (throws). Untracked-on-disk (gitignored, intentional): `design_handoff_convexa_redesign/`, `figma_frames/`.
