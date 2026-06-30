# convexa-redesign — FRONTEND_EXECUTION_CONTRACT (GATE V Ticker quick UX wins, 2026-06-30)

> **Scope:** two owner-approved quick UX wins on the **Ticker** page. FE-only,
> **NO_BACKEND_CHANGE / NO_INTERFACE_CHANGE** — display-only, consumes existing bundle fields. Bound to
> `PROJECT_CONTEXT.md`. Supersedes the prior Ticker-visual-fixes contract (shipped: `e23ffcb`).
>
> Two changes only: (A) compact big-number formatting for Net GEX / Net DEX; (B) a freshness indicator
> near the header. Both display-only — no value, computation, scoring, or data-flow change. The other
> quick-win ideas (distance-to-level, recent-ticker chips, sticky header, input ergonomics) are
> **deferred to BACKLOG §B "Ticker UX quick wins"** — do NOT build them here.

## Invariants (HARD — restate, do not touch)
- **`NO_BACKEND_CHANGE`** — nothing under `apps/api/`.
- **`[additive-keeps-score-byte-identical]`** — display formatting only; no scoring/bundle path touched.
- **`[live-vs-static-isolation]`** — the freshness indicator reflects the **REST bundle** age (static
  path); it is NOT a live/SSE element and must not be wired to `live`/`streamOffline`. It must not
  contradict the existing stale treatment or the "Couldn't refresh …" poll-error warning.
- **Token discipline** — no hardcoded hex; muted styling via theme (`text.secondary`/`text.disabled`).
- Keep `npx nx test dashboard` green (was 412/412). Update only tests that assert the OLD literal
  Net GEX/DEX format; add tests for the new formatter + the freshness line.

## Change A — compact big-number formatting (B/M/K, sign-first)
Today large dollar magnitudes render M-only: `Net DEX $36607.0M` (that's $36.6B) is hard to parse.

1. Add a shared formatter to `apps/dashboard/src/app/ticker/sections/copy.ts` — e.g.
   `fmtUsdCompact(v: number | null): string`:
   - `null` → `'—'` (or keep callers' own null handling; match existing behavior).
   - Sign FIRST, then `$`: a negative is `−$12.3M`, never `$-12.3M`. Use the figure minus `−`
     (U+2212, as the IV-skew copy already does), consistent across the app.
   - Thresholds on the absolute value: `≥ 1e9 → $X.XB`, `≥ 1e6 → $X.XM`, `≥ 1e3 → $X.XK`, else `$X`
     (round to 1 decimal for B/M/K; integers below 1e3). Examples: `36_607_000_000 → −/+$36.6B`,
     `793_200_000 → $793.2M`, `-12_300_000 → −$12.3M`.
2. Apply it to:
   - `DealerPositioning.tsx:46` **Net GEX** value (replace `` `$${(m.net_gex / 1e6).toFixed(1)}M` ``).
   - `DealerPositioning.tsx:49` **Net DEX** value (the `m.net_dex == null ? 'unavailable' : …` branch).
   - `copy.ts:32` **`fmtDexM`** (the DEX tooltip breakdown for call/put dex via `netDexTip`) → route it
     through `fmtUsdCompact` so the tooltip matches the tile. Keep its `null → '—'` behavior.
3. The Net GEX tile's `accent` (up/down color) stays driven by the sign of `m.net_gex` — unchanged.
4. **Out of scope:** `gex-profile-chart.tsx` `fmtM` (per-strike values are intentionally M-scaled and
   small) and the Y-axis — leave them. Only the two tiles + the DEX tooltip helper change.

## Change B — freshness indicator near the header
The bundle carries `data.meta.freshness = { snapshot_iso, data_age_seconds, stale, stale_after_seconds }`
(`fresh` in `TickerDashboard.tsx:142`). A background poll runs every `POLL_MS` (60s); `loading`
(`TickerDashboard.tsx:66`) is `true` while a `getTicker` is in flight.

Add a subtle, muted freshness line near the header that builds trust in the data age:
- Show **"Updated {age} ago"** where `{age}` derives from the freshness (reuse `humanAge(...)` from
  `copy.ts` — already imported in `TickerDashboard`). A live-counting age (a 1s tick so it counts up
  between polls, keyed off `snapshot_iso`) is **preferred**; a static-per-poll `humanAge(data_age_seconds)`
  is an acceptable floor. If you live-count, do it in a small self-contained component (own `setInterval`,
  cleared on unmount) — keep `TickerHeader`'s existing props/behavior (last-trade byte-identical, the
  connection chip) untouched.
- When a background refresh is in flight (`loading === true` while `data` is present), append a quiet
  **"· refreshing…"** affordance (text or a small spinner). It disappears when the poll resolves.
- **Placement:** near the price/levels context — either a muted caption rendered in `TickerDashboard`
  right after `<TickerHeader>`, or passed into `TickerHeader` as new optional props and rendered in the
  status row / under the last-trade line. Muted styling (`text.disabled`/`text.secondary`, caption size).
- **Honesty / no contradiction:** this reflects the last successfully-loaded bundle's age. Do NOT show
  "updated 0s ago" while data is stale, and do NOT duplicate or contradict the existing
  `fresh.stale` handling or the "Couldn't refresh — showing data from … ago" warning
  (`TickerDashboard.tsx:218-222`). On a poll error the existing warning still owns that message; the
  freshness line may simply keep showing the last good age (and may show "refreshing…" only while a
  retry is actually in flight). It is the REST bundle's age — never wired to `live`/`streamOffline`.

## Verification (the lane runs this)
- `npx nx test dashboard` green. Add: formatter unit tests (B/M/K boundaries, sign placement, null) and
  a test for the freshness line ("Updated …" present; "refreshing…" shows while a poll is in flight,
  clears after). Update any existing assertion of the old Net GEX/DEX literal format.
- **Render-verify via the preview MCP** (`preview_start dashboard` → :4300, TSLA): confirm Net DEX now
  reads like `$36.6B` (not `$36607.0M`), Net GEX unchanged-but-via-the-formatter, and the "Updated Ns
  ago" line shows near the header (and ticks/refreshes). Ticker full-page screenshots can hang — prefer
  `preview_snapshot`/`preview_eval`; if the preview MCP isn't available in your lane, say so and verify
  statically + via the suite.

## Definition of done
- `fmtUsdCompact` added + applied to Net GEX, Net DEX, and the DEX tooltip helper; Net DEX reads in $B.
- A muted "Updated {age} ago [· refreshing…]" freshness line near the header, driven by the REST
  freshness + `loading`; honest, not contradicting the stale/poll-error treatments.
- `npx nx test dashboard` green (new tests added; old-format assertions updated); lint clean; no
  `apps/api` file touched (`git diff --stat -- apps/api` empty).
- Hand back: files changed, test count, and the preview render-verification note (Net DEX in $B + the
  freshness line behavior).
- **Do not commit** — the conductor verifies and commits on the branch.
