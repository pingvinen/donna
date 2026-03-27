# Phase 5: Fix the constant timeout warnings - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-27
**Phase:** 05-fix-the-constant-timeout-warnings
**Areas discussed:** Guard strategy, Fallback behavior, Test updates

---

## Todo Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Stop using timeout if not installed | ref: #18 — Check for timeout availability or find alternative | ✓ |
| Document why periodic run-tools not supported | ref: #23 — docs area, weak match | |
| Check for new Donna version once per day | Tooling area, weak match | |
| Skip setup prompt when already configured | Tooling area, weak match | |

**User's choice:** Folded timeout todo (#18) only
**Notes:** Other todos were weak keyword matches, not related to timeout fix

---

## Guard Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Use Bash tool timeout param | The Bash tool already has a timeout parameter (in ms). Replace all timeout N cmd with native timeout. No external dependency. | ✓ |
| Detect and conditionally wrap | Check command -v timeout at workflow start, wrap only if available. | |
| Remove timeout entirely | Drop all timeout wrapping. Trust commands complete in reasonable time. | |

**User's choice:** Use Bash tool timeout param (Recommended)
**Notes:** Cleanest approach — removes external dependency entirely

---

## Fallback Behavior (Duration)

| Option | Description | Selected |
|--------|-------------|----------|
| Keep same durations | 10s (10000ms) for tool commands, 15s (15000ms) for GraphQL introspection | ✓ |
| Increase durations | Bump to 15s/20s respectively | |
| You decide | Claude picks appropriate durations | |

**User's choice:** Keep same durations (Recommended)
**Notes:** None

---

## Test Updates

| Option | Description | Selected |
|--------|-------------|----------|
| Remove timeout assertions | Since Bash tool handles timeout natively, drop assertions checking for timeout in workflow text | ✓ |
| Replace with Bash tool timeout check | Update assertions to verify workflow mentions timeout durations | |
| You decide | Claude picks the right test approach | |

**User's choice:** Remove timeout assertions (Recommended)
**Notes:** None

---

## Claude's Discretion

- Exact wording of workflow instructions for Bash tool timeout param
- Whether to add explanatory comments about why timeout binary is not used

## Deferred Ideas

None — discussion stayed within phase scope
