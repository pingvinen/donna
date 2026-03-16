---
status: resolved
trigger: "CONTRIBUTING.md does not mention GSD (the project's core development workflow) or the no-milestones approach."
created: 2026-03-16T00:00:00Z
updated: 2026-03-16T00:00:00Z
---

## Current Focus

hypothesis: CONTRIBUTING.md was written before GSD was adopted and was never updated to reflect the development workflow or the no-milestones convention
test: Compare CONTRIBUTING.md content against CLAUDE.md conventions and repo .planning/ structure
expecting: CONTRIBUTING.md missing any mention of GSD, phases, backlog-driven work, or the no-milestones policy
next_action: diagnosis complete — return findings

## Symptoms

expected: CONTRIBUTING.md should explain that this project uses GSD for planning and execution, and that it follows a no-formal-milestones approach (backlog-driven, organic releases)
actual: CONTRIBUTING.md contains zero mentions of GSD, phases, backlog, milestones, or the development workflow. The "Conventions" section (line 84-89) cherry-picks three items from CLAUDE.md but omits the entire "Development Approach" section.
errors: N/A (content gap, not runtime error)
reproduction: Read CONTRIBUTING.md — search for "GSD", "milestone", "backlog", "phase" — zero hits
started: Since file creation; never included this content

## Eliminated

(none — diagnosis was straightforward)

## Evidence

- timestamp: 2026-03-16T00:00:00Z
  checked: CONTRIBUTING.md full content (99 lines)
  found: No mention of GSD, milestones, backlog, phases, or development workflow anywhere in the file
  implication: Contributors have no visibility into how the project plans and executes work

- timestamp: 2026-03-16T00:00:00Z
  checked: CLAUDE.md "Development Approach" section (lines 13-16)
  found: Three conventions defined — "Deployment first", "Real skills, not throwaway dummies", "No formal milestones" — none surfaced in CONTRIBUTING.md
  implication: The Conventions section in CONTRIBUTING.md selectively references CLAUDE.md but skips the Development Approach entirely

- timestamp: 2026-03-16T00:00:00Z
  checked: CONTRIBUTING.md "Conventions" section (lines 84-89)
  found: Lists three conventions (naming, README updates, no git from subagents) and links to CLAUDE.md with "See CLAUDE.md for the full list." Does NOT mention development workflow or approach.
  implication: The link to CLAUDE.md exists but the most contributor-relevant convention (how work is planned/executed) is not highlighted

- timestamp: 2026-03-16T00:00:00Z
  checked: Repo-wide grep for "GSD" / "gsd" / "get-shit-done"
  found: 46 files reference GSD — all in .planning/ directory and workflows. GSD is deeply embedded in the project's planning and execution process.
  implication: GSD is the core development methodology but CONTRIBUTING.md gives no indication of this

## Resolution

root_cause: |
  CONTRIBUTING.md has two gaps:

  1. **No GSD workflow explanation.** The project uses GSD (Get Shit Done) as its core development workflow — visible in .planning/ with phases, research, validation, and verification artifacts (46 files reference it). CONTRIBUTING.md does not mention GSD at all. A contributor would not know that work is planned through GSD phases, that research precedes execution, or how to interact with the .planning/ directory.

  2. **No mention of the no-milestones approach.** CLAUDE.md explicitly states "No formal milestones: Work from a backlog, ship what's important. Releases happen organically when enough value has accumulated." The CONTRIBUTING.md Conventions section cherry-picks three conventions from CLAUDE.md but omits the entire "Development Approach" section, including this policy.

  The gap is specifically in two places:
  - The "Conventions" section (line 84) should highlight the development approach, not just naming/git rules
  - There is no "Development Workflow" or "How We Plan Work" section explaining GSD

fix: (not applied — diagnosis only)
verification: (not applicable)
files_changed: []
