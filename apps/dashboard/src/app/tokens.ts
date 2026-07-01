/**
 * Design tokens — the SINGLE SOURCE shared by the running app (`theme.ts`) and the Figma design system
 * (file "Convexa — Web App (Design Reference)", collections Primitives/Color/Spacing/Radius/Typography).
 *
 * GENERATED / KEPT-IN-SYNC: regenerate with `node scripts/sync-figma-tokens.mjs` (see that file).
 * Values here mirror the Figma variables 1:1. `theme.ts` consumes `palette`/`shape`/`typographyTokens`;
 * the MUI-palette subset becomes `--mui-palette-*` CSS vars (theme.ts `cssVariables: true`).
 *
 * Editing rule: change a token HERE (or in Figma + re-sync), never hardcode a hex in a component.
 * Output-neutral by construction — these are exactly the values the theme shipped before extraction.
 */

/** MUI palette values per color scheme (dark = the historical default / anonymous baseline). */
export const palette = {
  dark: {
    primary: '#4f9cff',
    success: '#2ecc71', // calls / positive gamma / +P&L
    error: '#ff5c5c', //   puts / negative gamma / −P&L
    warning: '#ffa726', // amber — stale/offline, gamma-flip line, "coming soon"
    info: '#29b6f6', //    cyan — live dot/line, live status
    // Off-white (Catskill White) per the Figma — softer than pure #fff for body/headings.
    text: { primary: '#e6edf3', secondary: '#8b949e', disabled: '#5b6675' },
    background: { default: '#0e1117', paper: '#161b22' },
  },
  light: {
    primary: '#1d6fe0',
    success: '#1e9e57',
    error: '#d23b3b',
    warning: '#ed6c02',
    info: '#0288d1',
    text: { secondary: 'rgba(0, 0, 0, 0.6)', disabled: 'rgba(0, 0, 0, 0.38)' },
    background: { default: '#f5f6f8', paper: '#ffffff' },
  },
} as const;

/** MUI `shape` token (cards 10px; controls/chips override locally per the redesign). */
export const shape = { borderRadius: 10 } as const;

/** MUI `typography.fontFamily` + the mono numeric stack (Figma `font-family/sans` · `font-family/mono`). */
export const typographyTokens = {
  fontFamily: 'Inter, system-ui, Segoe UI, Roboto, sans-serif',
  monoFontFamily: '"Roboto Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
} as const;

/**
 * Presentation-only extras (Figma: `color/bg/raised`, `color/bg/hatch-alt`, `color/text/secondary|disabled`,
 * `color/accent/violet`). NOT MUI palette entries — applied via `sx` literals, so they have no `--mui-*`
 * var. Kept here so the values are still single-sourced and the Figma↔code sync covers them.
 */
export const extras = {
  panelRaised: '#1c2330',
  hatchAlt: '#14181f',
  textSecondary: '#8b949e',
  textDisabled: '#5b6675',
  accentViolet: '#7b5cff',
  // WhatsSentDrawer surfaces (Figma `137:1639`) — recessed code blocks + the egress-note banner.
  // Applied via `sx` literals in StateExportDrawer (no `--mui-*` var); single-sourced here.
  codeBg: '#0b0e14', //      code-block background (recessed near-black, darker than background.default)
  codeBorder: '#29303d', //  hairline for code blocks + the drawer's left edge (solid, not the MUI divider)
  codeText: '#c7d1db', //    mono code text (lighter than text.secondary)
  egressBg: '#172947', //    egress-note banner background (deep blue tint)
  egressText: '#b2d1ff', //  egress-note banner text (light blue)
} as const;
