# Donna Done Workflow

<objective>
Mark one or more tasks as complete in today's daily journal file and commit the change to git.
</objective>

<step name="read-config">
Read `~/.config/donna/config.md`.

If the file does not exist, print:
```
✗ Donna is not configured. Run /donna:setup first.
```
Stop.

Extract the `storage_repo` field from the YAML frontmatter. Also extract `auto_push` (default: false).
</step>

<step name="find-daily-file">
Run via Bash to get today's date:
```bash
date +%Y-%m-%d
```

Store the result as `<date>`. Construct the daily file path: `<storage_repo>/daily/<date>.md`.

If the file does not exist, print:
```
✗ No daily file for today. Add a task first with /donna:add-task
```
Stop.
</step>

<step name="read-tasks">
Read the daily file with the Read tool.

Find all lines matching the pattern `- [ ] <description>` (open tasks). Collect them as `<open_tasks>`.

If no open tasks are found, print:
```
✓ All tasks already complete for today!
```
Stop.
</step>

<step name="select-tasks">
Two modes based on whether an argument was provided to this command:

**With argument** (e.g., `/donna:done buy milk`):
Use your natural language understanding to fuzzy-match the argument against the open task descriptions. If a match is found, show it and use AskUserQuestion to confirm:
```
Mark as done: '<task>'? (yes/no)
```
If no match is found, tell the user and list all open tasks.

**Without argument**:
Show a numbered list of all open tasks, e.g.:
```
Open tasks for today:
1. buy milk
2. review PR
3. send email to Alice
```
Use AskUserQuestion to ask:
```
Which task(s) would you like to mark as done? (enter number or numbers separated by commas)
```

Store the confirmed task(s) as `<completed_tasks>`.
</step>

<step name="mark-complete">
For each task in `<completed_tasks>`, replace `- [ ] <description>` with `- [x] <description>` in the daily file.

Write the updated file with the Write tool.
</step>

<step name="git-commit">
Run via Bash:
```bash
git -C <storage_repo> add -A
```

Check whether there is anything to commit:
```bash
git -C <storage_repo> status --porcelain
```

If the output is empty, skip the commit and continue.

If one task was completed, run:
```bash
git -C <storage_repo> commit -m "donna(done): <description>"
```

If multiple tasks were completed, run:
```bash
git -C <storage_repo> commit -m "donna(done): <N> tasks completed"
```

If `auto_push` is true in config, also run:
```bash
git -C <storage_repo> push
```
</step>

<step name="confirm">
For each completed task, print:
```
✓ Done: <description>
```
</step>
