# convexa-redesign — FRONTEND_EXECUTION_CONTRACT (GATE V: StateExportDrawer → THEME-NATIVE, 2026-06-30)

> **Scope:** the StateExportDrawer reskin (committed `3aae8ce`) matched the Figma's layout but used
> **bespoke hardcoded hex tokens** (`codeBg/codeBorder/codeText/egressBg/egressText`) that are NOT part of
> the app's MUI theme — so the drawer stopped matching the rest of the app. **Owner directive
> (2026-06-30): "make sure this component uses my theme."** Rebind the drawer to the existing MUI
> theme/palette; remove the bespoke tokens. FE-only, **NO_BACKEND_CHANGE**. Keep the Figma layout/structure
> from `3aae8ce` (420px tray, header, egress banner, Copy-all, 3 sections + code blocks) — only the COLOR
> SOURCING changes: theme tokens instead of literals.
>
> Bound to `PROJECT_CONTEXT.md`. Supersedes the prior (literal-hex) reskin contract.

## The core change: theme-native color sourcing
**Remove** the 5 bespoke entries added to `apps/dashboard/src/app/tokens.ts` `extras` in `3aae8ce`
(`codeBg`, `codeBorder`, `codeText`, `egressBg`, `egressText`) — they were the "not my theme" part. Then
rebind every surface in `StateExportDrawer.tsx` to the MUI theme via `sx` theme refs / `useTheme()` +
`alpha()`:

| Element | Was (bespoke hex) | Use (theme) |
|---|---|---|
| Drawer left border | `extras.codeBorder` #29303d | `theme.palette.divider` (`borderColor: 'divider'`) |
| Drawer paper bg | (default) | leave = `background.paper` (already themed) ✓ |
| Egress banner bg | `extras.egressBg` #172947 | `alpha(theme.palette.info.main, 0.14)` (theme info tint) |
| Egress banner text | `extras.egressText` #b2d1ff | `theme.palette.info.light` (fallback `info.main`) |
| Code block bg | `extras.codeBg` #0b0e14 | `background.default` (recessed vs the paper drawer) |
| Code block border | `extras.codeBorder` #29303d | `divider` |
| Code block text | `extras.codeText` #c7d1db | `text.secondary` |
| Section title | `text.primary` (already themed) | keep `text.primary` ✓ |
| Section COPY link | `primary.main` (already themed) | keep `primary.main` ✓ |
| Caption | `text.disabled` (already themed) | keep ✓ |

Result: **zero hardcoded color hex** in `StateExportDrawer.tsx` and **no bespoke color tokens** — every
color comes from the app's theme, so the drawer is consistent with every other surface. The mono font may
still come from `typographyTokens.monoFontFamily` (that's a theme-level token, fine).

## Copy-all button — themed, no color overrides
Keep `<Button variant="contained" size="small">` (Figma shows a filled primary button) with **no `sx`
color/bg overrides** — it renders purely from the theme's primary. (Casing: owner has no preference —
keep the app default sentence-case "Copy all".)
> **Known theme note (do NOT fix here unless told):** the theme's `primary.main` (#4f9cff) has no explicit
> `contrastText`, so MUI auto-picks **black** text on the button. That is a separate **app-wide** theme
> decision the owner deferred — it is NOT in scope for this component pass. Leave the button to the theme;
> the conductor will surface the contrastText option separately.

## PRESERVE exactly (unchanged from `3aae8ce`)
- The Figma layout: 420px right drawer (`{xs:'100%', sm:420}`), 20px padding, 16px-rhythm `Stack`, no
  dividers, header (15px/600 title + muted close `aria-label="Close export"`), egress banner (8px radius,
  px1.5/py1.25, 12px/1.45), Copy-all left-aligned, 3 sections (13px/600 title + small primary `COPY` +
  first-section caption 11px), code blocks (8px radius, mono 10px, lineHeight 1.6, pre-wrap, maxHeight 220,
  overflow auto).
- ALL behavior/wiring: `fetchRecExport` useEffect + idle/loading/error, `RecExport` shape + `sectionText`,
  `copy()` + `Snackbar`, `<Drawer anchor="right">` + open/onClose, `EXPORT_HEADER(ticker)` title text, the
  egress-note copy source, per-section copy buttons, egress honesty.
- **Invariants:** `NO_BACKEND_CHANGE`, `[additive-keeps-score-byte-identical]`, token discipline (now via
  the THEME rather than bespoke literals).

## Verification (the lane runs this)
- `npx nx test dashboard` green (was 425/425). No behavioral change → no new tests required; update any
  assertion only if it referenced a removed token (none should — tokens.ts extras are internal).
- Grep `StateExportDrawer.tsx` for `#` hex → **zero**. Grep `tokens.ts` for the 5 removed keys → **zero**.
- **Render-verify via preview MCP** (`preview_start dashboard` → :4300, desktop viewport, TSLA → AI-rec
  panel → "View what's sent"): confirm the drawer now reads with the app's theme surfaces — info-tinted
  egress banner, recessed `background.default` code blocks with a `divider` border, themed primary
  Copy-all. It should feel consistent with the app's other cards/surfaces. Ticker screenshots can hang →
  prefer computed-style `preview_eval` (report the resolved `background`/`borderColor`/`color` values) or
  scope to `.MuiDrawer-paper`.

## Definition of done
- `StateExportDrawer.tsx` sources every color from the MUI theme; the 5 bespoke `extras` tokens are removed
  from `tokens.ts`; zero color hex in the component. Layout/behavior unchanged from `3aae8ce`.
- `npx nx test dashboard` green; lint clean; `git diff --stat -- apps/api` empty.
- Hand back: files changed, test count, and the resolved computed-style values (egress bg = a themed info
  tint, code bg = background.default, borders = divider) proving it's theme-driven.
- **Do not commit** — the conductor verifies (render + computed styles) and commits.
