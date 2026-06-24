# ai-recommendations — pipeline manifest
Entry:        architect-first
Stage:        Both lanes DONE + verified → ready for GATE Q (QA/Verify).
              Backend: conformance 4/4, score byte-identical, best-effort isolation (this repo).
              Frontend: gammaflow-web commit 42212f5; `nx test` 25/25 green (ai-rec.spec T1–T18/E matrix).
Repos:        both
Brief:        BRIEF.md present
Contracts:
  - ARCHITECTURE_CONTRACT.md   locked
  - PRODUCT_CONTRACT.md        locked
  - UX_BLUEPRINT.md            locked
  - INTERFACE_CONTRACT.md      locked   <- FE↔BE binding (incl. ## Conformance spec for system-1)
  - BACKEND_EXECUTION_CONTRACT.md   locked
  - FRONTEND_EXECUTION_CONTRACT.md  locked
Open amendments: GATE Z (conformance-spec convention) RESOLVED 2026-06-23 → standalone-file canonical
              (BACKLOG §E system-12); INTERFACE_CONTRACT §3 now references
              `.claude/tools/conformance/ai_recommendations.json` (the runnable spec). Backend lane in lane.
QA (GATE Q):  pending — awaiting the Frontend lane
Canon note:   RELAXES promoted invariant `ai-external-no-llm` by owner decision (2026-06-23); pending
              formal demotion in GAMMAFLOW_CONTEXT §8 / OPEN_THREADS §9 + DECISION_LEDGER at GATE S.
Last gateway:  GATE U·X @ 2026-06-23
