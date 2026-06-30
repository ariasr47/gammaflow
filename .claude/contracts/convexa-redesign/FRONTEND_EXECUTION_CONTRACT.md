# FRONTEND_EXECUTION_CONTRACT — convexa-redesign · SURFACE: Settings / Auth

> Per-surface contract (overwrites the prior Landing one; Landing is shipped). Implement-from-Figma.
> **NO_BACKEND_CHANGE · NO_INTERFACE_CHANGE.** Presentation-only re-skin + a nav signed-in-state change.
> Authority: `design_handoff_convexa_redesign/README.md` §1 (nav) + §6 (Settings/Auth) + `FIGMA_COMPONENT_MAP.md`.
> Tokens via the MUI theme (`primary.main`, `text.secondary`, `background.*`, `divider`, `warning.main`) — no hex
> except the avatar gradient (`#4f9cff`→`#7b5cff`, the accent/violet token). Figma Settings frame: node `4:2572`.

## Part A — Nav signed-in profile  (`auth/AccountControl.tsx`)
Today the signed-in branch is a name button + a dropdown menu (Settings / Log out). Change to the Figma:
- **Signed-in** → show the **email** (secondary, hidden < sm to save space is OK) + a **32px gradient avatar**
  (circle, `linear-gradient(135deg, #4f9cff, #7b5cff)`, the user's initial in white 600). The avatar is a
  **RouterLink to `/settings`** (clicking the profile opens Settings). **Remove the dropdown menu.**
  `data-testid="account-avatar"` on the avatar link; keep showing the email with `data-testid="account-email"`.
- **Log out moves to the Settings Account panel** (Part B) — it is NO LONGER in the nav.
- **Signed-out** branch stays exactly as now (the Log in ghost + Sign up gradient pill → auth modal). Keep
  `data-testid="account-signin"` + `account-signup`.
- Loading branch unchanged (`account-loading`).

## Part B — Settings page  (`auth/SettingsPage.tsx` + `auth/AiKeySection.tsx`), per Figma `4:2572`
Layout: a **centered column, max-width ~640**, page heading **"Settings"** + subtitle **"Tuned to your account."**,
then **three stacked `background.paper` panel cards** (rounded `card` radius, 1px `divider` border, padding ~24,
gap ~24). Uppercase field labels (11px, 700, letter-spacing, `text.secondary`) like the auth modal.

1. **Account panel** — heading "Account".
   - **Signed-in:** the **32px gradient avatar** + display name (else email, 700) + email (secondary) on the
     left; a **"Sign out"** button on the right (`variant="outlined"`, `data-testid="settings-signout"`) →
     `auth.signOut()`. (This is where logout now lives.)
   - **Signed-out:** "Sign in to sync your settings across devices." + a **Sign in** button → `openAuth({mode:'login'})`.
2. **AI key panel** (`AiKeySection.tsx` re-skin) — heading "AI key" + the verbatim `AUTH_COPY.settings.aiKey.helper`.
   - **Key set:** masked `Key set ···· {last4}` (use `maskedKeyLabel`) + **Replace** + **Remove** buttons. **NO
     reveal/show/copy control anywhere** (security floor — AC). Remove → confirm dialog (existing copy).
   - **No key:** a password-type input (`inputPlaceholder` "sk-ant-…") + helper "Stored encrypted; you won't be
     able to view it again." + **Add key**. Anonymous → the `aiKey.anonymous` sign-in prompt.
   - Keep ALL existing logic + testids + the write-only/encrypted security floor verbatim; this is restyle only.
3. **Preferences panel** — heading "Preferences" + verbatim `AUTH_COPY.settings.themeHelper` ("Affects appearance
   only.") / the "never alters the score" copy.
   - **Active persona** — select (`useSettings`/`usePersona` wiring unchanged).
   - **Default ticker** — text input + helper `AUTH_COPY.settings.defaultTickerHelper`.
   - **Theme** — a **segmented control** (Dark / Light / System) using MUI `ToggleButtonGroup` (exclusive),
     wired to the existing theme pref (`useSettings`). Active = primary.
   - Keep **server-wins (signed-in) / client-local (anonymous)** behavior + per-account isolation; theme/persona/
     ticker are **never scoring inputs** (score-neutral).
Footer: the same disclaimer caption as Landing (reuse the copy).

## Invariants (verify in tests)
- `additive-keeps-score-byte-identical` — no setting feeds scoring; `NO_BACKEND_CHANGE`.
- `server-side-gate-enforcement` — the gate wiring (sim-trade/ask-AI) is untouched here; Settings only edits prefs.
- AI key **write-only, masked, no reveal** (security floor) — assert no show/copy/reveal affordance exists.
- Tokens via theme; the only literal is the avatar gradient.

## Tests (`auth/*.spec.tsx`)
- **Rewire logout** in `auth.flow.spec.tsx`: signed-in nav shows `account-avatar` (links `/settings`), **no**
  dropdown/`account-menu-button`. To log out: render/navigate to `/settings`, click `settings-signout` → nav flips
  back to Log in / Sign up; who-am-I anonymous. Update T-D1 (and any `account-menu-button` use) accordingly.
- Avatar links to `/settings` (named test).
- Settings page: Account (signed-in avatar+email+Sign out / signed-out Sign in), AI key (key-set masked +
  Replace/Remove with **no reveal control**; no-key add-input; anonymous prompt), Preferences (persona select,
  default-ticker input, theme segmented switches the pref). Keep the existing AiKeySection behavioral tests green.
- `npx nx test dashboard` green, no regression.

## Verify
`git diff` scope = `auth/SettingsPage.tsx`, `auth/AiKeySection.tsx`, `auth/AccountControl.tsx`, the auth specs.
**Do NOT commit** — the conductor renders (preview MCP) + commits.

## Reference
- README §1 (nav signed-in) + §6 (Settings/Auth) — structure/copy authority.
- Figma Settings frame `4:2572`; the conductor has inspected it; this contract carries the detail (lane has no live Figma).
- `FIGMA_COMPONENT_MAP.md` — TextField/Button/Card/Tabs(segmented)/Top-nav rows.
