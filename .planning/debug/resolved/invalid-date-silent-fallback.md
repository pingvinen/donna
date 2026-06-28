---
status: diagnosed
trigger: "Invalid date expressions silently fall back to today instead of warning user"
created: 2026-06-17T22:00:54+02:00
updated: 2026-06-17T22:02:00+02:00
---

## Current Focus
hypothesis: CONFIRMED. Line 110 in resolve-date step instructs silent fallback to today when the resolved date is NaN or invalid. No error is printed to the user.
test: Read the exact text at line 110 and confirm it says "fall back to today's date (re-run Case 1)" with no mention of alerting the user.
expecting: Line 110 is the sole root cause. Fix: replace the fallback instruction with an error output and optionally halt.
next_action: Return ROOT CAUSE FOUND diagnosis.

## Symptoms
expected: When an unparseable date (e.g., "banana day") is provided to `/donna:follow-up`, the system should tell the user the date is invalid so they can correct it.
actual: "banana day" results in a fallback to today's date with no warning. The follow-up is scheduled for today without alerting the user.
errors: None — this is a silent failure, not an error.
reproduction: Run `/donna:follow-up "some task" "banana day"`. The task gets scheduled for today with confirmation message, no mention that the date was invalid.
started: Since follow-up workflow was created (Phase 07). Always broken — designed to silently fall back.

## Eliminated
(no hypotheses eliminated — root cause confirmed on first hypothesis)

## Evidence
- timestamp: 2026-06-17T22:01:00+02:00
  checked: workflows/follow-up.md, resolve-date step, line 110
  found: "If the resolved date is NaN or invalid (check by verifying the output matches YYYY-MM-DD format), fall back to today's date (re-run Case 1)."
  implication: This is the exact instruction that tells the agent to silently use today's date. No error output or warning is specified anywhere in the resolve-date step.
  
- timestamp: 2026-06-17T22:01:30+02:00
  checked: workflows/follow-up.md, resolve-date step, lines 60-113 (entire resolve-date step)
  found: Cases 1 (null → today), 2 (YYYY-MM-DD → direct), 3 (relative expression → parse). Line 110 sits at the end of Case 3 and handles the invalid-parsing scenario. No error output instruction exists before or after line 110.
  implication: The only place that deals with invalid dates is line 110, and it does exactly the wrong thing — silently falls back. There is no alternative path for invalid dates.

- timestamp: 2026-06-17T22:01:45+02:00
  checked: workflows/follow-up.md, confirm step, lines 149-153
  found: "✓ Follow-up scheduled: <description> (due: <due_date>)" — always prints success with whatever due_date was resolved.
  implication: Even after silent fallback, the user sees a success message with today's date, reinforcing the wrong impression that their input was valid.

- timestamp: 2026-06-17T22:02:00+02:00
  checked: common bug patterns matching
  found: Matches "Error Handling → Swallowed error" pattern — invalid input silently caught and replaced with default rather than surfaced.
  implication: Confirms this fits a well-known anti-pattern. The fix follows the standard remedy: surface the error instead of swallowing it.

## Resolution
root_cause: |
  In workflows/follow-up.md, the `resolve-date` step (line 110) instructs:
  "If the resolved date is NaN or invalid (check by verifying the output matches YYYY-MM-DD format), fall back to today's date (re-run Case 1)."
  
  This instruction tells the AI agent to silently replace any unparseable date expression (e.g., "banana day") with today's date. No error message or warning is emitted. The user sees a success confirmation with today's date, believing their date input was accepted — which means the follow-up will surface on the wrong day.

  The mechanism: an unparseable expression like "banana day" fails Case 2 (not YYYY-MM-DD) and enters Case 3 (relative expression). The agent's language understanding cannot map "banana day" to any recognized pattern, so the resulting date computation produces NaN or garbage. The YYYY-MM-DD format check on line 110 detects this... and immediately falls back to today with no user notification.
fix: (diagnosis only — not applying fix)
verification: (diagnosis only — not verifying)
files_changed: []