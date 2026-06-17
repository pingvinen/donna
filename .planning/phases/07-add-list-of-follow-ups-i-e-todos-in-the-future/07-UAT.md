---
status: complete
phase: 07-add-list-of-follow-ups-i-e-todos-in-the-future
source: 07-01-SUMMARY.md, 07-02-SUMMARY.md, 07-03-SUMMARY.md
started: 2026-06-17T18:01:05+02:00
updated: 2026-06-17T21:59:55+02:00
---

## Current Test

[testing complete]

## Tests

### 1. Schedule a follow-up from CLI
expected: Running `/donna:follow-up "Buy groceries" "next friday"` schedules a follow-up entry with resolved date, commits, and confirms.
result: pass

### 2. Schedule a follow-up interactively
expected: Running `/donna:follow-up` with no arguments prompts for description and time expression via AskUserQuestion, then schedules the follow-up the same as CLI mode.
result: issue
reported: "It prompts, but it says 'Type your task' with a description of 'Use the other option below to enter...'. But there is no 'other' option. There is a type your answer, but then the question+X options thing does not make any sense. Then a 'describe your task' and then freetext input would be better. The same thing happens for the due date."
severity: major

### 3. Relative date resolution
expected: Time expressions like "tomorrow", "next monday", "in 3 days" resolve to correct YYYY-MM-DD dates using local timezone (not UTC), with no `toISOString` usage.
result: pass

### 4. Invalid date falls back to today
expected: An unparseable or NaN date expression shows an error message telling the user the date is invalid, instead of silently falling back to today.
result: issue
reported: "I do not agree that it should 'fall back'. It should tell the user what is wrong with the date, otherwise the user will think everything was fine and will then be annoyed tomorrow when it pops up"
severity: major

### 5. Follow-ups surface in begin-the-day
expected: Running `/donna:begin-the-day` surfaces follow-up items due today or past-due in the Tasks section of the daily file.
result: pass

### 6. Past-due follow-ups show overdue annotation
expected: Past-due follow-ups display with `(overdue N days)` annotation in the daily Tasks section.
result: issue
reported: "That annotation is a bit dangerous. If I do not finish the task that day and it is carried forward, it would have to be updated. I think that complexity is unnecessary, so I think we should remove the '(overdue N days)'. As long as it hits my task list, I am fine."
severity: minor

### 7. Surfaced follow-ups removed from standing file
expected: After begin-the-day surfaces a follow-up, the entry is removed from `donna/follow-ups.md` (not checked off, not left with marker).
result: pass

### 8. Follow-up deduplication
expected: If a follow-up task matches an already-existing task in the daily file (after normalizing overdue suffix), it is not duplicated.
result: pass

### 9. Installer lists follow-up skill
expected: Running the Donna installer shows "follow-up" in the success message's comma-separated skills list.
result: pass

### 10. README documents follow-up skill
expected: README.md contains `/donna:follow-up` in the Daily workflow commands table; `follow-ups.md` appears in the directory tree.
result: issue
reported: "It does. However, I am wondering if it would be better to rename it to 'add-follow-up-task' as that will allow a user thinking 'I need to add something' to find it simply by writing '/add' and they might even see it and notice while just using the regular 'add-task'."
severity: minor

## Summary

total: 10
passed: 6
issues: 4
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Invalid date expressions show an error to the user"
  status: failed
  reason: "User reported: I do not agree that it should 'fall back'. It should tell the user what is wrong with the date, otherwise the user will think everything was fine and will then be annoyed tomorrow when it pops up"
  severity: major
  test: 4
  artifacts: []
  missing: []
- truth: "Overdue annotation on past-due follow-ups"
  status: failed
  reason: "User reported: That annotation is a bit dangerous. If I do not finish the task that day and it is carried forward, it would have to be updated. I think that complexity is unnecessary, so I think we should remove the '(overdue N days)'. As long as it hits my task list, I am fine."
  severity: minor
  test: 6
  artifacts: []
  missing: []
- truth: "Skill is named for discoverability alongside add-task"
  status: failed
  reason: "User reported: I am wondering if it would be better to rename it to 'add-follow-up-task' as that will allow a user thinking 'I need to add something' to find it simply by writing '/add' and they might even see it and notice while just using the regular 'add-task'."
  severity: minor
  test: 10
  artifacts: []
  missing: []