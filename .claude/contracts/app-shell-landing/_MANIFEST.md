# app-shell-landing — pipeline manifest
Entry:        architect-first
Stage:        Frontend built (Convexa shell + landing + relocated ticker/positions; self-reported 171 tests green, 42/42 ACs); Backend NO_BACKEND_CHANGE; awaiting QA (GATE Q)
Repos:        frontend (FE-only restructure + Convexa landing; NO_BACKEND_CHANGE)
Brief:        BRIEF.md present
Contracts:
  - ARCHITECTURE_CONTRACT.md        locked
  - PRODUCT_CONTRACT.md             locked (42 ACs enumerated)
  - UX_BLUEPRINT.md                 locked
  - INTERFACE_CONTRACT.md           locked (NO_BACKEND_CHANGE — consumes existing endpoints)
  - BACKEND_EXECUTION_CONTRACT.md   NO_BACKEND_CHANGE
  - FRONTEND_EXECUTION_CONTRACT.md  locked
Open amendments: UX_AMENDMENTS.md — degraded-mark wording RESOLVED (reuse existing PositionRow wording; behavior satisfies AC-PosLive-2/3/4; no re-build)
QA (GATE Q):  pending
Last gateway:  GATE §5 (Frontend build) @ 2026-06-24
Program:      Owner pivot (positions-centric multi-page) — Track A, feature 1 of 4
