# FRONTEND_EXECUTION_CONTRACT — convexa-redesign · SURFACE: Positions (code re-skin)

Bound to: `PROJECT_CONTEXT.md`, `README` (design authority), `THEME_TOKENS.md`, `MUI_KIT_KEYS.md`.
**NO_BACKEND_CHANGE / NO_INTERFACE_CHANGE** — consumes existing endpoints / SSE / durable store unchanged.

## Goal
Re-skin the React Positions feature (`apps/dashboard/src/app/positions/`) to match the Figma Positions
design (file `4Njtm8QGWIgm4rA0UESg8n`, page **"Screens - Positions" `93:2`**). Introduce **PositionRow**,
**PositionCard**, **PositionsPanel** as React components mirroring the Figma components
(PositionRow `106:52`, PositionCard `108:58`, PositionsPanel `113:838`). **PRESERVE all existing logic**,
behavior, durable store, live marks — and keep the entire positions spec suite GREEN.

## Hard rules
- **Re-skin + componentize, NOT a logic rewrite.** Do not change `usePortfolio`/`derive`/`store`/`entry`/
  `useTrends` behavior, durable store keys (`convexa.*`), the fill resolver, or any SSE/scoring wiring.
- **Preserve every `data-testid`** the specs rely on (`PositionsView.spec`, `positions-redesign.spec`,
  `positions-portfolio.flow.spec`, `acceptance.spec`, `positions-page.spec`, `PositionEntryDialog.spec`).
  If a testid must move, update the spec in the same change. **Net: `npx nx test dashboard` stays green.**
- **Token discipline (THEME_TOKENS.md): NO hardcoded hex.** Colors via MUI palette tokens
  (`primary.main`, `background.default`=page, `background.paper`=cards, a recessed surface for inputs,
  `text.primary/secondary`, `divider`, `success.main`/`error.main`/`warning.main`). Typography = **Inter**
  via MUI Typography variants / theme — no Roboto literals. Numeric cells use the mono family the theme
  exposes (Roboto Mono).
- **Invariants:** `[no-real-order-path]` (Live tab stays the zero-import LOCKED placeholder; everything
  `SIMULATED`), `[additive-keeps-score-byte-identical]` (positions never feed scoring), `[live-vs-static-
  isolation]` (live cells dim on SSE drop; records/customization/saved views persist).

## Components to create / re-skin (mirror Figma)
**PositionRow** (`positions/PositionRow.tsx` — re-skin existing). Figma `106:52`. Table row, 10 columns
aligned to the header: TICKER (ticker bold + sub muted) · STRATEGY · QTY · ENTRY · MARK · P/L · P/L % ·
Δ ENTRY · TREND (sparkline) · EXPIRY. Mono figures; P/L + P/L% colored by direction (success/error);
trend = `PlSparkline` (green up / red down); 1px divider between rows.

**PositionCard** (NEW `positions/PositionCard.tsx` — extract the card branch out of `PositionsView`).
Figma `108:58`. Card (paper bg, divider border, radius). Top: ticker bold + sub muted (left) + outlined
strategy chip (right). Mid: large mono P/L (colored) + P/L% beneath (left) + sparkline (right). Bottom:
Qty/Entry/Mark (muted label + mono value) (left) + expiry (right). Direction → P/L color + sparkline.

**PositionsPanel** (NEW `positions/PositionsPanel.tsx` — composite). Figma `113:838`. Wraps **Toolbar +
Filters + body** (Table OR Cards per the View toggle):
- Toolbar (re-skin `CustomizationToolbar`): View select ("All positions") · Table/Cards segmented ·
  Comfortable/Compact density segmented · Group None/Ticker/Strategy segmented · right "+ Open simulated
  position" primary button.
- Filters: status chips open/pending/closed/cancelled (active = primary tint) + History link.
- Body: `PositionsView` renders the PositionRow list (Table) or a 2-up PositionCard grid (Cards).
This is the reusable unit (the future Live-positions tab will reuse PositionsPanel).

**PositionsPage / PortfolioPanel** (re-skin). Header: "Positions" (Inter H1) + subtitle + right
"Net P/L (open)" + value (mono, colored). Tabs: **Simulated** (active, green `PAPER` chip) · **Live**
(lock, LOCKED). Simulated renders `PositionsPanel`; Live renders the locked ComingSoon state
(re-skin `LiveTabPanel` to the Figma `97:30` centered locked card; keep it zero-import).

## Reference
Figma page `93:2` (Table `93:3`, Cards `96:16`, Live `97:30`). Component map → `MUI_KIT_KEYS.md`; token
IDs + binding recipes → `THEME_TOKENS.md`. **The lane has NO live Figma access** — match the structural
spec above + the existing shipped behavior; read the existing `positions/*` files to preserve logic + testids.

## Tests to write (+ keep all existing green)
- `PositionCard`: renders ticker/sub/strategy/P-L/P-L%/sparkline; direction drives P/L color.
- `PositionsPanel`: renders toolbar + filters + body; Table↔Cards toggle switches the body; filter chips.
- `PositionRow`: column set + mono/Inter typography + direction color.
- The flow specs (`positions-portfolio.flow`, `acceptance`) MUST still pass unchanged in behavior.

## Verify
`npx nx test dashboard` green (+ `@org/api`); lint + build clean. (Conductor preview-verifies the rendered
Table/Cards/Live screens after the lane reports done.)
