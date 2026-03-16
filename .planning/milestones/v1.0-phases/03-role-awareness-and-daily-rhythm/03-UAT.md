---
status: complete
phase: 03-role-awareness-and-daily-rhythm
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md]
started: 2026-03-15T12:00:00Z
updated: 2026-03-15T12:05:00Z
---

## Current Test

[testing complete]

## Tests

### 1. donna:set-role Skill Invocation
expected: Running `/donna:set-role` starts the workflow. It reads config.md, then asks for your job title, team size, direct reports, and key responsibilities via AskUserQuestion.
result: pass

### 2. set-role Web Research and Recurring Tasks
expected: After providing role details, the workflow performs 2-3 WebSearch queries about your role, presents a research summary, then lets you approve/reject/modify suggested recurring tasks one by one.
result: pass

### 3. set-role Persistence
expected: After approval, the workflow writes role.md (with YAML frontmatter + prose summary), role-research.md, and recurring.md to your storage repo, then commits.
result: pass

### 4. set-role Rerun Detection
expected: Running `/donna:set-role` again (when role.md already exists) offers a menu with options: reset, diff-update, re-research, or cancel — instead of starting fresh.
result: pass

### 5. donna:begin-the-day Skill Invocation
expected: Running `/donna:begin-the-day` starts the workflow. It reads config.md, finds today's date, then looks for the previous day's journal file.
result: pass

### 6. begin-the-day Carry-Forward
expected: Open tasks from the previous day's journal appear in today's file with a "(1 times)" counter. If a task was already carried once with "(1 times)", it becomes "(2 times)", etc.
result: pass

### 7. begin-the-day Recurring Task Surfacing
expected: Tasks from recurring.md that are due today (based on interval: daily, weekdays, first-of-month, every-other) appear in today's task list.
result: pass

### 8. begin-the-day Deduplication
expected: If today's file already exists with some tasks, re-running begin-the-day does not duplicate existing tasks. Closed tasks also block recurring tasks from being re-added.
result: pass

### 9. done.md Counter Strip
expected: When marking a carried task as done (e.g., "Review PRs (2 times)"), the "(2 times)" suffix is stripped — the completed task appears as clean "- [x] Review PRs" without the counter.
result: pass

### 10. Installer Lists All Five Skills
expected: Running the installer shows a success message mentioning all 5 skills: setup, add-task, done, set-role, begin-the-day.
result: pass

## Summary

total: 10
passed: 10
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
