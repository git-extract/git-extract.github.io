# Claude Code Instructions

Extends `AGENTS.md` — read that file first. Rules here are Claude Code specific.

---

## Exploration

- Use `Glob` and `Grep` tools before reading files — avoid loading large files speculatively.
- When a task touches both `frontend/` and `worker/`, explore them in parallel with sub-agents.
- Prefer the `Explore` sub-agent for open-ended codebase searches.

## Making Changes

- Always read a file before editing it.
- Use `Edit` (targeted diff) rather than `Write` (full rewrite) for existing files.
- Run the relevant workspace lint/build after changes to catch issues early:
  - Frontend: `npm -w frontend run lint`
  - Worker: `npm -w worker run build`

## Git

- The `Co-Authored-By: Claude ...` trailer must never appear in any commit message.
  This applies to commits created manually or via the `Bash` tool.
- Do not amend commits that have already been pushed without explicit user instruction.
- Do not `git push --force` without explicit user confirmation each time — prior approval
  does not carry over to subsequent pushes.

## Sub-agents

- When spawning sub-agents, pass them a self-contained prompt — they have no memory of
  the current session.
- Sub-agents should be told explicitly whether they are allowed to write files or are
  research-only.
