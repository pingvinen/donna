---
status: diagnosed
trigger: "AskUserQuestion shows 'Type your task' with a description of 'Use the other option below to enter...'. But there is no 'other' option. There is a type your answer, but then the question+X options thing does not make any sense. Then a 'describe your task' and then freetext input would be better. The same thing happens for the due date."
created: 2026-06-17T22:00:48+02:00
updated: 2026-06-17T22:01:30+02:00
---

## Current Focus

hypothesis: CONFIRMED — see Resolution

## Symptoms

expected: Running `/donna:follow-up` (no arguments) prompts for task description with a simple free-text input, then prompts for due date with a simple free-text input
actual: AskUserQuestion shows confusing "Type your task" header with description text about "Use the other option below" when there is no other option. The question+options combo doesn't make sense for free-text input.
errors: No technical errors — UX confusion with AskUserQuestion rendering
reproduction: Run `/donna:follow-up` with no arguments
started: Since follow-up.md was created (Phase 07)

## Eliminated

## Evidence

- timestamp: 2026-06-17T22:00:48+02:00
  checked: follow-up.md parse-input step (lines 42-57) AskUserQuestion usage
  found: |
    First question: "What task would you like to schedule?"
    Second question: "When is it due? (e.g. \"in 2 months\", \"on 2026-09-15\", or leave blank for today)"
    The CRITICAL note says: "Use free-text input mode for both questions — do NOT use a picker with predefined options."
    However, the second question contains parenthetical examples "(e.g. ...)" that Claude Code's AskUserQuestion tool may interpret as option hints, rendering a multi-mode UI with picker + free-text.
  implication: The parenthetical examples in the second question are the likely cause of the confusing multi-mode UI

- timestamp: 2026-06-17T22:00:48+02:00
  checked: add-task.md get-description step (lines 28-37) AskUserQuestion usage
  found: |
    Single question: "What task would you like to add?"
    No parenthetical examples, no "or leave blank", no multi-sentence structure.
    Pure, simple free-text question.
  implication: add-task.md demonstrates the correct pattern — a single-sentence, simple question that AskUserQuestion renders as a clean free-text input

- timestamp: 2026-06-17T22:00:48+02:00
  checked: contribute-idea.md ask-idea step (lines 27-37) AskUserQuestion usage
  found: |
    Question: "What's your idea or bug report?\n\nDescribe it in a few sentences — I'll check if something similar already exists before creating an issue."
    Multi-line but no parenthetical examples with "e.g." or "or leave blank"
  implication: Multi-line is fine; the problem is specifically the parenthetical examples that Claude Code renders as a picker

- timestamp: 2026-06-17T22:00:48+02:00
  checked: Claude Code AskUserQuestion tool behavior (inferred from UAT report)
  found: |
    The UAT report states: "'Type your task' with a description of 'Use the other option below to enter...'. But there is no 'other' option."
    This means Claude Code rendered the second question as a labeled field "Type your task" (actually the task description field) with a description text about "Use the other option below" — which is the typical Claude Code AskUserQuestion rendering when it detects option-like content in the question text.
    The user then sees a picker-like UI (question + options list) that doesn't make sense for free-text input.
  implication: Claude Code's AskUserQuestion parses the question text for option-like patterns and renders a multi-mode UI when it finds them. The parenthetical "(e.g. \"in 2 months\", \"on 2026-09-15\", or leave blank for today)" triggers this behavior.

## Resolution

root_cause: |
  The `follow-up.md` parse-input step (lines 43-57) has TWO issues causing confusing AskUserQuestion rendering:

  **Issue 1 (lines 51-54): The second question includes parenthetical examples that Claude Code parses as picker options.**

  ```
  When is it due? (e.g. "in 2 months", "on 2026-09-15", or leave blank for today)
  ```

  Claude Code's AskUserQuestion tool sees the parenthetical containing comma-separated example values and renders a multi-mode UI: a question header with a picker menu of options underneath, plus a free-text field. The user sees "Type your task" (the label for the task description field) with description text like "Use the other option below to enter..." — but the "other" option is the free-text input itself, creating a confusing two-mode interface.

  **Issue 2 (lines 45-48): The first question also uses suboptimal wording.**

  ```
  What task would you like to schedule?
  ```

  This is actually fine on its own, but the `CRITICAL` note on line 57 says "Use free-text input mode for both questions — do NOT use a picker with predefined options." The note is correct in intent but Claude Code doesn't have a "mode" selection for AskUserQuestion — it infers the mode from the question text structure.

  **Comparison with add-task.md (the correct pattern):**

  add-task.md (line 33): `What task would you like to add?`
  - Single sentence, no parenthetical, no examples, no "or leave blank"
  - Renders as a clean, single-line free-text input
  
  follow-up.md (lines 51-54): `When is it due? (e.g. "in 2 months", "on 2026-09-15", or leave blank for today)`
  - Multi-part with parenthetical examples and "or" alternatives
  - Renders as a confusing picker + free-text combo

  **The CRITICAL note (line 57) is aspirational, not enforceable:**
  Claude Code's AskUserQuestion doesn't have a parameter to force "free-text mode" vs "picker mode." The rendering mode is inferred by Claude Code from the question text itself. Workflows must craft their question text to avoid triggering the picker mode, not rely on a "CRITICAL" instruction that the tool cannot follow.

fix: |
  **Do NOT apply these changes** — this is a diagnosis-only mode. The fix should:

  1. In `workflows/follow-up.md`, lines 51-54: Change the second question from:
     ```
     When is it due? (e.g. "in 2 months", "on 2026-09-15", or leave blank for today)
     ```
     To a simple free-text question without parenthetical examples:
     ```
     When is it due?
     ```

  2. In `workflows/follow-up.md`, line 57: Replace the CRITICAL note with a prose instruction placed BEFORE the AskUserQuestion calls (not after), explaining that the agent should include examples in a prose block printed to the user before asking the question, NOT inside the AskUserQuestion text itself. This is the established Donna pattern (see Decision in STATE.md: "Capability examples moved outside AskUserQuestion as print-before-ask prose blocks to avoid Claude Code picker menu rendering").

     The pattern should be:
     1. Print examples to the user as plain text
     2. Then use AskUserQuestion with a simple, clean question

  3. The add-task.md get-description step should serve as the template — single-sentence, no parenthetical, no examples inside the AskUserQuestion text.

verification: |
  After fix, running `/donna:follow-up` (no args) should show:
  - First prompt: Prose examples printed, then simple "What task would you like to schedule?" in a clean free-text field
  - Second prompt: Simple "When is it due?" in a clean free-text field
  - No "Use the other option below" text, no picker menu, no multi-mode confusion
files_changed: []