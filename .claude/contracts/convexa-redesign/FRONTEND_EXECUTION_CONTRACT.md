# FRONTEND_EXECUTION_CONTRACT — convexa-redesign · SURFACE: Scanner

> Per-surface contract (overwrites the prior Settings/Auth one; Landing + Settings/Auth are shipped).
> Implement-from-Figma. **NO_BACKEND_CHANGE · NO_INTERFACE_CHANGE.** Presentation-only re-skin of the
> static coming-soon Scanner page. ZERO data work (the absence of any network call IS the requirement).
> Authority: `design_handoff_convexa_redesign/README.md` §5 + the Figma frame **"Scanner — Coming soon"**
> (frame source = `figma_frames/08-scanner-soon.html` → `screenScanner()`; the conductor has carried the
> exact pixel values into this contract — the lane has NO live Figma access).
> Tokens via the MUI theme (`primary.main`, `text.secondary`, `text.primary`, `divider`, `warning.main`,
> `background.paper`). The ONLY allowed sx literals are the documented hatch/badge-alpha exceptions named below.

## Scope
- **Edit ONLY** `apps/dashboard/src/app/scanner/Scanner.tsx` and add `apps/dashboard/src/app/scanner/scanner.spec.tsx`.
- Re-skin the existing placeholder to match the Figma frame **pixel-for-pixel** (centered hatched card,
  blue scanner glyph, heading, roadmap copy, amber "coming soon" badge + a Ticker link).
- **Do NOT change** routing, the AppShell/TopNav, or any other surface.

## Hard constraints carried from the existing suite (must stay green — these are load-bearing)
1. The card keeps **`data-testid="scanner-placeholder"`** (asserted in `app.spec.tsx` + `shell-live-lifecycle.flow.spec.tsx`).
2. The heading text is **exactly** `Scanner — coming soon` (asserted in `app.spec.tsx`).
3. **AC-Scan-1 — zero network.** The page issues **no fetch / no SSE / no compute / no spinner / no skeleton**
   on mount. The flow spec asserts no bundle fetch is triggered when Scanner shows. Keep it a pure static render.
4. The Ticker link keeps **`data-testid="scanner-ticker-link"`** and routes to `/ticker` (a real built surface
   — this is the one allowed affordance; it does not imply the Scanner works).

## Pixel spec (from the Figma frame `screenScanner()` — match exactly)
**Page wrapper:** centered content, `maxWidth: 1240`, `mx: auto`, `p: 3` (24px). (The shell already provides the
nav; this is the page body.)

**The hatched inert card** — reuse the inert hatched container `ui/ComingSoonBox` (preserves the structural
`no-real-order-path` inertness — the box never links), overriding its sx to the frame values, and override its
default test id to `scanner-placeholder`:
- `maxWidth: 560`, `mx: 'auto'`, `my: 8` (64px top/bottom).
- **Hatch (frame-exact, 20px stripes):** `backgroundImage: 'repeating-linear-gradient(135deg, #161b22 0 20px, #14181f 20px 40px)'`
  — `#161b22` = `background.paper`, `#14181f` = `extras.hatchAlt` (documented hatch sx-literal exception, as in `ComingSoonBox`).
- `border: '1px dashed'`, `borderColor: 'divider'`.
- **`borderRadius: '14px'`** (frame radius — overrides the box default).
- **`padding: '52px 40px'`**, `textAlign: 'center'`.
- Pass `data-testid="scanner-placeholder"` (ComingSoonBox spreads `...rest` last, so this overrides its default `coming-soon-box`).

**Scanner glyph** — an inline SVG (a blue magnifier with a check inside; the frame's scanner mark). Render
directly (small enough not to warrant a `ui/` primitive this surface). `width=48 height=48`, `viewBox="0 0 24 24"`,
`fill="none"`, centered as a block with `margin: '0 auto 16px'`, `aria-hidden`:
- `<circle cx=11 cy=11 r=7 stroke="…primary.main…" strokeWidth=1.8 />`
- `<path d="M16 16 L21 21" stroke="…primary.main…" strokeWidth=1.8 strokeLinecap="round" />`
- `<path d="M8 11 L10.5 13.5 L14 8.5" stroke="…primary.main…" strokeWidth=1.6 strokeLinecap="round" strokeLinejoin="round" />`
- Use the theme primary as the stroke: read it via `useTheme()` → `theme.palette.primary.main` (so it's token-driven,
  not a hardcoded hex), or `stroke="currentColor"` on a wrapper with `sx={{ color: 'primary.main' }}`.

**Heading (`Typography` h1):** text `Scanner — coming soon`; `fontSize: '1.5rem'`, `fontWeight: 700`, `mb: '12px'`.

**Body (`Typography` p):** `maxWidth: 420`, `mx: 'auto'`, `mb: '22px'`, `fontSize: '0.92rem'`, `lineHeight: 1.6`,
`color: 'text.secondary'`. Copy **verbatim** (note the em dash and curly apostrophe), with **Ticker** bolded in
`text.primary`:
> A multi-ticker scanner that surfaces the strongest setups across names is on the roadmap. It’s not live yet — for now, analyze one ticker at a time on the **Ticker** page.

(`Ticker` is a `<Box component="strong" sx={{ color: 'text.primary' }}>` / `fontWeight` inherited; the rest is `text.secondary`.)

**Action row (`Box`/`Stack` row):** `display:'flex'`, `alignItems:'center'`, `justifyContent:'center'`, `gap:'14px'`:
1. **"coming soon" badge** — an uppercase amber pill. `fontSize:'0.68rem'`, `fontWeight:600`, `letterSpacing:'.04em'`,
   `textTransform:'uppercase'`, `color:'warning.main'`, `border:'1px solid'`, `borderColor:'warning.main'` (or the
   frame alpha `rgba(255,167,38,0.35)`), `bgcolor:'rgba(255,167,38,0.08)'` (faint amber fill — documented badge-alpha
   sx-literal exception, derived from the `warning.main` token `#ffa726`), `borderRadius:999`, `padding:'3px 10px'`,
   `whiteSpace:'nowrap'`. Label `coming soon`. (You MAY reuse `ui/ComingSoonBadge` if you extend it to this exact
   style; otherwise render inline to match the frame — the frame wins on pixels.)
2. **Ticker link** — `Link component={RouterLink} to="/ticker"`, `data-testid="scanner-ticker-link"`,
   `underline="hover"`, `fontSize:'0.88rem'`, `fontWeight:600`, `color:'primary.main'`. Label `Go to the Ticker viewer →`.

## Invariants (verify in tests)
- **AC-Scan-1 / `no-real-order-path` kinship** — the page does ZERO network/compute on mount; assert (a render that
  spies the global fetch, or relies on the flow spec) that no fetch fires. The card is inert (hatched, no broker/order
  affordance); the only link goes to the real `/ticker` surface.
- `additive-keeps-score-byte-identical` / `NO_BACKEND_CHANGE` — Scanner touches no data, no setting, no scoring path.
- Tokens via theme; the only literals are the documented hatch stripe colors + the badge amber-alpha tints.

## Tests (`scanner/scanner.spec.tsx`)
- Renders `scanner-placeholder` and the exact heading `Scanner — coming soon`.
- Renders the roadmap body copy (match a stable substring incl. "strongest setups") and the bolded **Ticker** word.
- Renders the amber "coming soon" badge and the `scanner-ticker-link` pointing to `/ticker` (assert `href`/route).
- **Zero-network:** mount the Scanner in isolation with `global.fetch` spied → assert it is **never called** (no
  fetch/SSE on mount). (Mirrors AC-Scan-1; complements the shell flow spec.)
- Run `npx nx test dashboard` — **all green, no regression** (the existing `app.spec.tsx` Scanner assertions +
  `shell-live-lifecycle.flow.spec.tsx` no-scan assertion must still pass).

## Verify
`git diff` scope = `scanner/Scanner.tsx` + the new `scanner/scanner.spec.tsx` ONLY. **Do NOT commit** — the conductor
renders (Claude_Preview MCP) against the frame + commits.

## Reference
- README §5 (Scanner) — structure/copy authority. See [[convexa-redesign-spec-authority]].
- Figma frame "Scanner — Coming soon" (`figma_frames/08-scanner-soon.html` → `screenScanner()`); this contract
  carries the exact px values (the lane has no live Figma).
- `FIGMA_COMPONENT_MAP.md` — `ComingSoonBox` (`32:3`) is the inert hatched container; `@mui/material` atoms otherwise.
