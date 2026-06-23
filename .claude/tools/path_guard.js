#!/usr/bin/env node
// PreToolUse hook: block writes outside this repo root (system-4b mirror).
// One carve-out: the per-project Claude auto-memory store (~/.claude/projects/<proj>/memory) is
// exempt — a sanctioned harness write location, not a cross-repo code path.
const path = require('path');
const os = require('os');
const REPO_ROOT = path.resolve(__dirname, '..', '..'); // .claude/tools -> repo root
const GUARDED = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit']);
let raw = '';
process.stdin.on('data', d => (raw += d));
process.stdin.on('end', () => {
  let p; try { p = JSON.parse(raw); } catch { process.exit(0); }
  if (!GUARDED.has(p.tool_name)) process.exit(0);
  const ti = p.tool_input || {};
  const t0 = ti.file_path || ti.notebook_path;
  if (!t0) process.exit(0);
  const cwd = p.cwd || REPO_ROOT;
  const target = path.resolve(path.isAbsolute(t0) ? t0 : path.join(cwd, t0));
  // Sanctioned carve-out (system-4b): the Claude per-project auto-memory store lives OUTSIDE the
  // repo (~/.claude/projects/<proj>/memory); the harness writes it via Write/Edit — allow it.
  const memRel = path.relative(path.join(os.homedir(), '.claude', 'projects'), target);
  if (memRel && !memRel.startsWith('..') && !path.isAbsolute(memRel) && memRel.split(path.sep).includes('memory')) process.exit(0);
  const rel = path.relative(REPO_ROOT, target);
  if (rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))) process.exit(0);
  process.stderr.write(`path_guard (system-4b): BLOCKED ${p.tool_name} to '${target}' — outside this repo (${REPO_ROOT}).\n`);
  process.exit(2);
});
