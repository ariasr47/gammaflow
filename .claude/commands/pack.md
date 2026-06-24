---
description: Show / emit the minimal context pack a feature needs (system-5 sharding).
argument-hint: <feature-folder> [--print]
---
For feature `$ARGUMENTS`, run the ground-truth retrieval tool and report. (Use the interpreter from
`.claude/project.json` → `backend.python`; the context filename comes from `project.json` → `context_file`.)

- Default (`--stat`): `<project.json backend.python> .claude/tools/context_for.py $ARGUMENTS` — show
  which context sections LOAD (always-load invariant floor + the BRIEF's `Context tags:`) vs skip, and
  the line savings.
- If I pass `--print`: run `<project.json backend.python> .claude/tools/context_for.py $ARGUMENTS --print`
  and emit the assembled pack — that's what you hand a fresh role subagent instead of the whole canon.

Reminder: the invariant floor always loads, so a feature with no `Context tags:` is under-informed but
never unsafe.
