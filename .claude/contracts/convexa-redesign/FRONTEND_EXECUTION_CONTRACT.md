# convexa-redesign — FRONTEND_EXECUTION_CONTRACT (GATE V: contained-button treatment, 2026-06-30)

> **Scope:** an **app-wide theme** fix (owner-approved) for **contained primary buttons**. Today the dark
> theme's `primary.main` is `#4f9cff` (a bright accent) with no `contrastText`, so MUI auto-picks **black**
> text on filled buttons — the washed look the owner flagged on the StateExportDrawer "Copy all". Make
> contained-primary buttons a **deeper, white-legible blue** (matching the Figma's `~#1976d2` primary
> button and passing contrast), WITHOUT changing the `#4f9cff` accent used everywhere else (links, active
> nav, the section `COPY` links, chips, borders). FE-only, **NO_BACKEND_CHANGE**.
>
> Bound to `PROJECT_CONTEXT.md` + `THEME_TOKENS.md`. This is the button pass promised after the
> StateExportDrawer theme rebind (`56d77fd`).

## Files
- `apps/dashboard/src/app/tokens.ts` — add ONE token.
- `apps/dashboard/src/app/theme.ts` — add a `MuiButton` `containedPrimary` style override.

## The change
1. **tokens.ts:** add to `extras` a dedicated contained-button color:
   `buttonPrimaryBg: '#1d6fe0'` — the app's deep brand blue (same value as the light-scheme primary),
   legible with white text (≈5.5:1) and ≈ the Figma primary-button blue. Comment: "contained-primary
   button fill — deep enough for white text; the bright `#4f9cff` primary/accent is unchanged."
2. **theme.ts:** in `COMMON.components.MuiButton.styleOverrides`, ADD a `containedPrimary` entry (keep the
   existing `root: { textTransform: 'none' }`). Use a theme-callback so ONLY dark mode is darkened; light
   mode (primary `#1d6fe0` already + auto-white) is left to the theme default:
   ```ts
   containedPrimary: ({ theme }) => (theme.palette.mode === 'dark' ? {
     backgroundColor: extras.buttonPrimaryBg,
     color: '#fff',
     '&:hover': { backgroundColor: darken(extras.buttonPrimaryBg, 0.12) },
   } : {}),
   ```
   Import `darken` from `@mui/material/styles` and `extras` from `./tokens`. (Keeping `primary.main`
   `#4f9cff` untouched means text buttons, outlined buttons, links, `color="primary"` icons, chips, and the
   `COPY` links all stay the bright accent — only the FILLED (`variant="contained" color="primary"`)
   buttons get the deep blue + white text.)

Do NOT change `primary.main`, `primary.contrastText` globally, or any other palette value. Do NOT touch the
`#4f9cff` accent. This is scoped precisely to the contained-primary button surface.

## Preserve / invariants
- `NO_BACKEND_CHANGE`; `[additive-keeps-score-byte-identical]` (pure presentation theme change).
- Sentence-case buttons stay (the existing `root: { textTransform: 'none' }` is untouched).
- No other component files change — this is a theme-level fix that cascades to every contained button.

## Verification (the lane runs this)
- `npx nx test dashboard` green (was 425/425). Color-only theme change → no behavioral change; update a
  test only if one asserts a button's exact color (none should).
- **Render-verify via preview MCP** (`preview_start dashboard` → :4300, desktop, TSLA):
  1. AI-rec panel → "View what's sent" → the **Copy all** button now reads as a **deep blue button with
     white text** (report the resolved `background-color` + `color` — expect ≈ `rgb(29,111,224)` bg +
     `rgb(255,255,255)` text).
  2. Spot-check at least one OTHER contained button still looks right (e.g. the ghost-trade
     `TradeEntryDialog` confirm, or the Prime banner "Simulate") — same deep-blue+white.
  3. Confirm a NON-contained primary element is UNCHANGED (still `#4f9cff`) — e.g. a section `COPY` link or
     an active nav item (report its resolved `color` ≈ `rgb(79,156,255)`).
  Ticker screenshots can hang → prefer computed-style `preview_eval`.

## Definition of done
- Contained-primary buttons render deep-blue (`#1d6fe0`) + white text in dark mode; the `#4f9cff` accent is
  unchanged everywhere else (verified on a `COPY` link / nav). One token added; `theme.ts` override added;
  no other files changed.
- `npx nx test dashboard` green; lint clean; `git diff --stat -- apps/api` empty.
- Hand back: files changed, test count, and the resolved computed-style values for (a) the Copy-all button
  bg+text, (b) one other contained button, (c) a `#4f9cff` accent element proving it's untouched.
- **Do not commit** — the conductor verifies (render) and commits.
