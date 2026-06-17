# Phase 7: Add list of follow-ups i.e. todos in the future - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-17
**Phase:** 07-add-list-of-follow-ups-i-e-todos-in-the-future
**Areas discussed:** File structure, Entry format, Capture UX, Daily surfacing

---

## File structure

| Option | Description | Selected |
|--------|-------------|----------|
| New standing file | Create donna/follow-ups.md as its own file. Keeps concerns separate — recurring.md stays for intervals, follow-ups.md for date-specific reminders. | ✓ |
| Merge into recurring.md | Refactor recurring.md into a combined file with both recurring intervals and future-dated follow-ups. | |

**User's choice:** New standing file (Recommended)
**Notes:** Clean separation from the existing recurring system. Each file has a single purpose.

---

## Entry format

| Option | Description | Selected |
|--------|-------------|----------|
| Checkbox with due date | Format: `- [ ] <description> | due: YYYY-MM-DD`. Concrete dates, simple to parse. | ✓ |
| Description only, date in metadata | Date stored as YAML frontmatter or separate index. | |

**User's choice:** Format like recurring (`- [ ] <description> | due: YYYY-MM-DD`). Items are removed from follow-ups.md when surfaced, not checked off. Relative dates resolved at capture time.
**Notes:** User explicitly stated follow-up items should be removed from the standing file when they become daily tasks — "we do not want a separate task list." The daily file becomes the sole owner.

---

## Capture UX

| Option | Description | Selected |
|--------|-------------|----------|
| New /donna:follow-up skill | Dedicated skill with date parsing. Clear separation from add-task. | ✓ |
| Extend /donna:add-task | Detect date hints in add-task arguments and route accordingly. | |

**User's choice:** New /donna:follow-up skill (Recommended)
**Notes:** Keeps the add-task flow simple (no date concept) and gives follow-ups their own clear command.

---

## Daily surfacing

| Option | Description | Selected |
|--------|-------------|----------|
| Append to Tasks section | Due follow-ups appear in the ## Tasks section mixed with regular tasks. | ✓ |
| Separate Follow-ups section | Due follow-ups under their own heading. | |

**User's choice:** Append to Tasks section (Recommended)
**Notes:** User wants integration with the existing flow, not a separate task list. Follow-ups become indistinguishable from regular tasks once surfaced.

---

### Surfacing removal behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Remove from follow-ups.md | Delete the line from the standing file after surfacing. | ✓ |
| Mark as done in follow-ups.md | Change checkbox to `[x]` to keep history. | |

**User's choice:** Remove from follow-ups.md (Recommended)
**Notes:** The daily file now owns the task. Carry-forward is handled by existing begin-the-day logic.

---

## the agent's Discretion

- Exact error handling for unparseable time expressions
- Whether `donna/follow-ups.md` uses frontmatter or a simple heading
- Implementation details of the relative-date resolver (pure node.js, no external dependencies)

## Deferred Ideas

None — discussion stayed within phase scope.