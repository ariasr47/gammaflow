# convexa-redesign — FRONTEND_EXECUTION_CONTRACT (GATE V: StateExportDrawer reskin, 2026-06-30)

> **Scope:** reskin the AI-rec **"What's sent to the AI" drawer** (`StateExportDrawer`) to match Figma
> node **`137:1639`** ("WhatsSentDrawer", file `4Njtm8QGWIgm4rA0UESg8n`). FE-only,
> **NO_BACKEND_CHANGE / NO_INTERFACE_CHANGE** — re-skin only; the data wiring, states, copy, egress
> invariant, and behavior are preserved byte-for-byte. Bound to `PROJECT_CONTEXT.md` + `THEME_TOKENS.md`.
> Supersedes the prior Ticker-quick-wins contract (shipped: `2ca5f49`).
>
> Conductor pulled the Figma design context (the conductor carries the detail — the lane builds without
> live Figma). The current component already has the right STRUCTURE (egress banner · Copy-all · three
> sections with per-section copy · code blocks) — this is a visual re-skin to the Figma's surfaces,
> colors, type, and spacing, not a rewrite.

## File
`apps/dashboard/src/app/ai-rec/StateExportDrawer.tsx` (the only component file changed). Tokens added to
`apps/dashboard/src/app/tokens.ts` (see below). Current code is the starting point — keep its logic.

## PRESERVE exactly (do NOT change — these are behavior/contract, not skin)
- The `fetchRecExport(ticker, { personaId })` fetch in the `useEffect` keyed on `[open, ticker, personaId]`;
  the `idle | loading | error` state machine; the loading + error renderings (re-skin their look, keep them).
- The `RecExport` shape consumed (`egress_note`, `context`, `persona_prompt`, `glossary`) and `sectionText()`.
- The `copy()` clipboard handler + the `Snackbar` toast (`COPY.export.copied`); `allText` assembly.
- The MUI **`<Drawer anchor="right">`** mechanism + the `open`/`onClose` props (the right-side tray is correct).
- The title text **`EXPORT_HEADER(ticker)`** = `What's sent to the AI · {ticker}` (a test matches it verbatim —
  `getByText("What's sent to the AI · TSLA")`). The close control keeps an accessible name (`aria-label="Close export"`).
- The egress-note **copy** (`data?.egress_note ?? COPY.export.egress…`) and the first section's caption text.
- The per-section **Copy** controls stay real buttons (accessible name preserved). Each code block keeps a
  `maxHeight` + `overflow:auto` so long prompt/glossary text scrolls (Figma shows short previews; keep scroll).
- **Invariants:** `[additive-keeps-score-byte-identical]` (no scoring path), `NO_BACKEND_CHANGE`, token
  discipline (no hardcoded hex in the component — see token additions). Egress honesty unchanged.

## Token additions (`apps/dashboard/src/app/tokens.ts`)
These Figma values aren't in the palette yet. Add them to the `extras` block (single-sourced, comment that
they're the WhatsSentDrawer Figma `137:1639` surfaces) and reference them from the component — no raw hex in
the `.tsx`:
- `codeBg: '#0b0e14'` — code-block background (recessed near-black, darker than `background.default`).
- `codeBorder: '#29303d'` — hairline for code blocks + the drawer's left edge (a solid border, distinct
  from the translucent MUI divider).
- `codeText: '#c7d1db'` — mono code text (lighter than `text.secondary`).
- `egressBg: '#172947'` — egress-note banner background (deep blue tint).
- `egressText: '#b2d1ff'` — egress-note banner text (light blue).

## Visual spec (match the Figma)
**Drawer paper:** width **420** (`{ xs: '100%', sm: 420 }`), padding **20px** (`p: 2.5`), background
`background.paper` (already `#161b22`), a **left hairline** `borderLeft: '1px solid ' + extras.codeBorder`.
Vertical rhythm ≈ **16px** between blocks (`Stack spacing={2}` or `gap: 16px`).

1. **Header row** (space-between, center): title `What's sent to the AI · {ticker}` in **Inter Semi Bold
   15px**, `text.primary` (white-ish). Close control on the right, muted (`text.secondary`) — keep the
   `IconButton`+`CloseIcon` (accessible) styled muted, or a muted `✕`; keep `aria-label="Close export"`.
2. **Egress banner** (replaces the MUI `<Alert>`): a `Box` with `bgcolor: extras.egressBg`,
   `color: extras.egressText`, `borderRadius: '8px'`, `px: 1.5, py: 1.25`, text **12px**, `lineHeight: 1.45`.
   Content = the egress note (same source as today). (If a test asserts `role="alert"` on this banner, give
   the Box `role="status"` or update the test — don't drop the text.)
3. **Copy all button:** MUI `<Button variant="contained" size="small">` (resolves to brand primary
   `#4f9cff`), `alignSelf: 'flex-start'`, label `COPY.export.copyAll`. **Sentence case** ("Copy all") per the
   app theme's global `MuiButton textTransform: none` — an INTENTIONAL deviation from the Figma's
   kit-default uppercase "COPY ALL" (the kit isn't re-themed yet; the app convention wins — record, don't "fix").
4. **Each of the 3 sections** (Computed snapshot (context) · Persona prompt · Field glossary):
   - **Section header row** (space-between): title in **Inter Semi Bold 13px**, `text.primary`; a small
     **`COPY`** action on the right — **10px**, `primary.main` (`#4f9cff`), minimal/text style (compact, no
     contained bg). Keep it a real button (accessible name; reuse the existing per-section copy handler).
   - **Caption** (FIRST section only — "Computed snapshot"): "A serialization of what Convexa already
     computed — no recompute, no new fetch. Null stays null." in **11px**, `text.disabled` (≈ `#6b7585`),
     `lineHeight: 1.4`.
   - **Code block:** `Box component="pre"` — `bgcolor: extras.codeBg`, `border: '1px solid ' +
     extras.codeBorder`, `borderRadius: '8px'`, `px: 1.5, py: 1.25`, font `typographyTokens.monoFontFamily`
     (Roboto Mono), **10px**, `color: extras.codeText`, `lineHeight: 1.6`, `whiteSpace: 'pre-wrap'`,
     `wordBreak: 'break-word'`, `maxHeight: ~220`, `overflow: 'auto'`, `m: 0`. Empty → `'—'`.
   - **No `<Divider>` lines** between sections — the Figma uses gap-only spacing. Remove them.

## Verification (the lane runs this)
- `npx nx test dashboard` green (was 425/425). Update only assertions that break on the re-skin (e.g. if a
  test queried the egress banner as `role="alert"`); never drop a text-presence/behavioral check. Add a
  small test only if a section/structure needs locking; not required if coverage already holds.
- **Render-verify via the preview MCP** (`preview_start dashboard` → :4300): on the Ticker page, open the
  AI-rec panel's **"View what's sent"** → confirm the drawer matches the Figma — 420px right tray, blue
  egress banner, Copy-all primary button, three sections with `COPY` links + near-black code blocks. (The
  dev session is signed in; the drawer opens from the rec panel header in any state.) Use
  `preview_snapshot`/`preview_screenshot`; if a Ticker screenshot hangs, scope to the drawer
  (`.MuiDrawer-paper`) or stop+start the server.

## Definition of done
- `StateExportDrawer` matches Figma `137:1639` (surfaces/type/spacing/colors via the new tokens); structure
  + behavior + egress copy preserved; dividers removed; width 420; sentence-case Copy-all (noted deviation).
- New tokens in `tokens.ts`; **zero raw hex** in `StateExportDrawer.tsx`.
- `npx nx test dashboard` green; lint clean; `git diff --stat -- apps/api` empty.
- Hand back: files changed, test count, and a render-verification note (ideally a drawer screenshot) vs the Figma.
- **Do not commit** — the conductor verifies (incl. a render check) and commits on the branch.
