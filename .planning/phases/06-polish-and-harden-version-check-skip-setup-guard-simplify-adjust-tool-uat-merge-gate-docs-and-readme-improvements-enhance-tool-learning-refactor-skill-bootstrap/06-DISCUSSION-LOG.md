# Phase 6: Polish and Harden - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 06-polish-and-harden
**Areas discussed:** Version check UX, Skip-setup guard, Tool learning depth, Bootstrap refactor

---

## Version Check UX

### When to check

| Option | Description | Selected |
|--------|-------------|----------|
| Once per day | First skill invocation of the day checks npm registry. Caches result. | ✓ |
| Every skill invocation | Always check before running any skill. Adds ~200ms latency. | |
| Only at install time | No proactive check — user runs npx manually. | |

**User's choice:** Once per day
**Notes:** None

### Update notification UX

| Option | Description | Selected |
|--------|-------------|----------|
| Non-blocking hint | Print single line then continue with skill normally. | ✓ |
| Blocking prompt | Ask user whether to update now or skip. | |
| Silent — log only | Record in version.md but don't print. | |

**User's choice:** Non-blocking hint
**Notes:** None

### Where the check runs

| Option | Description | Selected |
|--------|-------------|----------|
| In each workflow | Add check-version step to workflow bootstrap section. | ✓ |
| In the installer only | Installer checks on npx run. No workflow-level check. | |
| You decide | Claude picks. | |

**User's choice:** In each workflow (later folded into bootstrap.cjs per D-10)
**Notes:** None

### How to check the registry

| Option | Description | Selected |
|--------|-------------|----------|
| npm view | Shell out to `npm view @pingvinen/donna-assistant version`. | ✓ |
| HTTPS fetch | Fetch registry.npmjs.org directly. | |
| You decide | Claude picks. | |

**User's choice:** npm view
**Notes:** None

---

## Skip-setup Guard

### Detection method

| Option | Description | Selected |
|--------|-------------|----------|
| Config file exists | Check if config.md has a storage_repo path set. | ✓ |
| version.md exists | Check if version.md exists. Simpler but doesn't confirm setup. | |
| You decide | Claude picks. | |

**User's choice:** Config file exists
**Notes:** User clarified that the scope is narrower than initially discussed — the goal is simply to suppress the "Run /donna:setup" message in the installer when setup is already complete. Not a workflow-level guard.

---

## Tool Learning Depth

### Additional learning sources

| Option | Description | Selected |
|--------|-------------|----------|
| README / docs files | Look for README.md or docs/ in the tool's package directory. | |
| Web docs via fetch | Fetch the tool's documentation URL. | |
| Both local + web | Try local docs first, fall back to web docs. | |
| You decide | Claude picks. | |

**User's choice:** Other — Cascading approach: local README/docs first, then web docs, then source code analysis (with user opt-in). User specifically wants the option to "go really deep" into tool code.
**Notes:** User described a three-tier cascade that goes beyond the offered options.

### When to apply enhanced learning

| Option | Description | Selected |
|--------|-------------|----------|
| Both add-tool and relearn-tools | Same cascade logic in both skills. | ✓ |
| Only add-tool | Initial learning uses cascade. Re-learning stays lightweight. | |
| Only relearn-tools | Initial learning stays as-is. | |

**User's choice:** Both
**Notes:** None

### Source code analysis opt-in

| Option | Description | Selected |
|--------|-------------|----------|
| Ask first | After docs-based learning, ask user if they want source code analysis. | ✓ |
| Auto-analyze | Automatically try if fewer than 3 capabilities found. | |
| You decide | Claude picks. | |

**User's choice:** Ask first
**Notes:** None

---

## Bootstrap Refactor

### What to extract

| Option | Description | Selected |
|--------|-------------|----------|
| Config reading | Read config.md, extract storage_repo/daily_folder/auto_push. | ✓ |
| Migration runner | check-pending-migrations step. | ✓ |
| Obsidian sync | Obsidian daily-notes.json sync logic. | ✓ |
| Setup guard | The new 'is setup complete?' check. | |

**User's choice:** Config reading, Migration runner, Obsidian sync
**Notes:** Setup guard was not selected because D-04 scoped it to the installer only, not workflows.

### Module structure

| Option | Description | Selected |
|--------|-------------|----------|
| Shared workflow fragment | Markdown file referenced via @include-style. | |
| CJS module | Node.js module returning JSON, called via Bash. | ✓ |
| You decide | Claude picks. | |

**User's choice:** CJS module
**Notes:** User requested trade-off analysis. After reviewing pros/cons, chose CJS because: (1) consistency with GSD's gsd-tools.cjs pattern, (2) the complexity of CJS will likely be needed for future features anyway, (3) testable with existing test suite.

### Include version check in bootstrap

| Option | Description | Selected |
|--------|-------------|----------|
| Include it | bootstrap.cjs handles version check, returns update_available in JSON. | ✓ |
| Keep separate | Version check stays as its own workflow step. | |

**User's choice:** Include it
**Notes:** None

---

## Claude's Discretion

- UAT merge gate implementation details (D-06)
- README skills grouping categories (D-07)
- Bootstrap CJS module API shape and error handling

## Deferred Ideas

- Make UAT easier with sandbox environment and test tools (ref: #19)
- Evaluate natural language input as alternative to slash commands
