---
phase: 07-add-list-of-follow-ups-i-e-todos-in-the-future
plan: "01"
subsystem: capture
status: complete
tags: [follow-up, stub, workflow, date-resolution, capture]
requires: []
provides: [donna:follow-up-stub, donna:follow-up-workflow]
affects:
  - stubs/claude-code/donna/follow-up.md
  - workflows/follow-up.md
tech-stack:
  added: []
  patterns:
    - stub-workflow-split
key-files:
  created:
    - stubs/claude-code/donna/follow-up.md
    - workflows/follow-up.md
  modified: []
decisions:
  - "Stub follows add-task.md pattern exactly (YAML frontmatter, objective, execution_context — 3 sections)"
  - "Workflow uses 7-step capture flow matching add-task.md structure (init, parse-input, resolve-date, ensure-file, append-entry, git-commit, confirm)"
  - "Date resolution uses Node.js Date.setMonth/setDate/setFullYear with local component extraction; toISOString is prohibited"
  - "T-07-01 mitigation: invalid/NaN dates fall back to today"
  - "Interactive mode (no argument) uses two AskUserQuestion prompts with free-text input"
  - "Entry format follows D-02: `- [ ] description | due: YYYY-MM-DD`"
  - "ensure-file creates follow-ups.md with YAML frontmatter (created: date) and ## Follow-ups heading"
metrics:
  duration_seconds: 148
  completed_date: "2026-06-17T15:50:00Z"
---

# Phase 07 Plan 01: Follow-up Stub and Workflow — Summary

Create the `/donna:follow-up` capture skill as a stub-workflow pair. The stub delegates to a 7-step workflow that parses time expressions from user arguments, resolves relative dates to YYYY-MM-DD using Node.js Date arithmetic, writes entries to `donna/follow-ups.md`, and commits via `donna-tools.cjs`.

## Implementation

### Task 1: Create follow-up stub
Created `stubs/claude-code/donna/follow-up.md` matching the `add-task.md` stub pattern exactly:
- YAML frontmatter: name (`donna:follow-up`), description, allowed-tools (Read, Write, Bash, AskUserQuestion)
- `<objective>` block directing to the follow-up workflow
- `<execution_context>` block referencing `@~/.donna/workflows/follow-up.md`
- 3-section structure identical to add-task.md

**Commit:** `cfae66a`

### Task 2: Create follow-up workflow
Created `workflows/follow-up.md` with all 7 steps:

1. **init** — Bootstrap via `node ~/.donna/donna-tools.cjs init` (verbatim copy of add-task.md pattern), parsing JSON for `storage_repo`, `auto_push`, `update_available`
2. **parse-input** — Extract description and time expression from user argument; two AskUserQuestion prompts (free-text) when no argument is provided
3. **resolve-date** — Three-case resolution: null → today, YYYY-MM-DD → as-is, relative → Node.js `Date.setMonth()`/`setDate()`/`setFullYear()` with local component extraction (`getFullYear()`/`getMonth()+1`/`getDate()`). NEVER `toISOString()`. NaN/invalid → fallback to today (T-07-01 mitigation)
4. **ensure-file** — Create `donna/follow-ups.md` with YAML frontmatter (`created: <date>`) and `## Follow-ups` heading if not exists
5. **append-entry** — Read file, append `- [ ] <description> | due: YYYY-MM-DD` (D-02 format)
6. **git-commit** — `node ~/.donna/donna-tools.cjs commit "donna(follow-up): <description>" --files donna/follow-ups.md`
7. **confirm** — Print `✓ Follow-up scheduled: <description> (due: <due_date>)`

**Commit:** `ec6f6a5`

## Deviations from Plan

None — plan executed exactly as written. Both files created matching the specification, all 7 steps present, all acceptance criteria verified.

## Threat Mitigations Applied

| Threat ID | Mitigation | Implementation |
|-----------|-----------|----------------|
| T-07-01 | Validate resolved date; fall back to today on NaN | resolve-date step checks output matches YYYY-MM-DD; re-runs Case 1 (today) on failure |
| T-07-02 | Description is single-line plain text in markdown | Natural line-break constraint; no additional sanitization needed |

## Verification

- `grep -c 'name: donna:follow-up' stubs/claude-code/donna/follow-up.md` → 1 ✓
- All 7 workflow steps verified: `init`, `parse-input`, `resolve-date`, `ensure-file`, `append-entry`, `git-commit`, `confirm` ✓
- `toISOString` only appears in anti-pattern warning text (not used in code) ✓
- `donna-tools.cjs init` and `donna-tools.cjs commit` patterns match add-task.md ✓
- `setMonth()`/`setDate()`/`setFullYear()` used for date arithmetic ✓
- Local component extraction (`getFullYear()`, `getMonth()+1`, `getDate()`) with padding ✓
- `npm run lint:fix` passed cleanly ✓

## Known Stubs

None — no hardcoded empty values, placeholder text, or unwired components. The workflow is self-contained: init sets up runtime state, parse-input resolves to concrete values, and all remaining steps use resolved data.

## Self-Check

```
FOUND: stubs/claude-code/donna/follow-up.md
FOUND: workflows/follow-up.md
FOUND: cfae66a (Task 1 commit)
FOUND: ec6f6a5 (Task 2 commit)
```

## Self-Check: PASSED