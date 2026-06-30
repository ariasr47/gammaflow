# convexa-redesign — pipeline manifest
Entry:        restart 2026-06-29 — implement-from-Figma (v1 slice attempt reset; archived `convexa-redesign-v1-archive`)
Stage:        SURFACE: Landing — FE contract authored → spawning delivery-frontend (GATE V, agents-from-Figma)
Branch:       convexa-redesign (off main @ 2828bfa) — DS bridge (tokens.ts + cssVariables + sync script) kept; merge to main at GATE S
Repos:        frontend  (NO_BACKEND_CHANGE — apps/api untouched)
Brief:        n/a (restart) — README §2 + FIGMA_COMPONENT_MAP.md are the brief
Contracts:
  - ARCHITECTURE_CONTRACT.md   n/a (presentation-only)
  - PRODUCT_CONTRACT.md        n/a (README is product/UX spec)
  - UX_BLUEPRINT.md            n/a (README + prototype + Figma DS are the blueprint)
  - INTERFACE_CONTRACT.md      n/a (NO_INTERFACE_CHANGE — consumes existing endpoints/SSE unchanged)
  - FIGMA_COMPONENT_MAP.md     locked  (Pro-plan Code-Connect substitute: node-id ⇄ code/props for 17 components)
  - BACKEND_EXECUTION_CONTRACT.md   NO_BACKEND_CHANGE
  - FRONTEND_EXECUTION_CONTRACT.md  draft — SURFACE Landing (re-skin landing/Landing.tsx; restore+verify ui/ primitives)
Open amendments: none
QA (GATE Q):  n/a (pending build)
Last gateway:  GATE V (Landing) @ 2026-06-29 — implement-from-Figma

## Surface order (one at a time): Landing → Scanner → Positions → Ticker → Settings/Auth
## Workflow: conductor authors per-surface FE contract from README + map → delivery-frontend builds (no live Figma; conductor carries detail) → conductor renders/verifies (preview MCP) → commit on branch.
