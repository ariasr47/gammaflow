#!/usr/bin/env python
r"""path_guard.py — PreToolUse hook: lane-fence file writes to this repo (system-4b).

Completes the lane enforcement the per-role tool-allowlists (system-4) start. Tool-allowlists say WHICH
tools a role may use; this says WHERE they may write. It blocks Write/Edit/MultiEdit/NotebookEdit whose
target resolves OUTSIDE this repo root — so a session in the backend repo (C:\Dev\GammaFlow) cannot
write into the sibling frontend repo (C:\Dev\gammaflow-web) or arbitrary disk paths, and vice-versa
(install the mirror copy in gammaflow-web).

Wire as a PreToolUse hook in `.claude/settings.json` matching Write|Edit|MultiEdit|NotebookEdit. Reads
the hook payload on stdin; exit 0 = allow, exit 2 + stderr = block (the standard hook deny signal).
Fail-open on any malformed/unknown input so it never wedges a session. Stdlib only.
"""
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
GUARDED = ("Write", "Edit", "MultiEdit", "NotebookEdit")


def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return 0  # malformed payload → don't break the session
    if payload.get("tool_name", "") not in GUARDED:
        return 0
    ti = payload.get("tool_input", {}) or {}
    raw = ti.get("file_path") or ti.get("notebook_path")
    if not raw:
        return 0
    cwd = payload.get("cwd") or str(REPO_ROOT)
    target = Path(raw)
    if not target.is_absolute():
        target = Path(cwd) / target
    try:
        target = target.resolve()
        target.relative_to(REPO_ROOT)
        return 0  # inside this repo → allow
    except ValueError:
        sys.stderr.write(
            f"path_guard (system-4b): BLOCKED {payload['tool_name']} to '{target}' — outside this "
            f"repo ({REPO_ROOT}). Lane fence: a session in this repo may not write another repo or "
            f"arbitrary disk paths. If intended, run it from the owning repo's session.\n")
        return 2
    except OSError:
        return 0  # unresolvable path → fail-open


if __name__ == "__main__":
    raise SystemExit(main())
