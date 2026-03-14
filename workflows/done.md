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

Extract the `storage_repo`, `daily_folder` (default: `daily`), and `auto_push` (default: false) fields from the YAML frontmatter.

**Obsidian sync:** Check if `<storage_repo>/.obsidian/daily-notes.json` exists.
- If it exists and has a `folder` field that differs from `<daily_folder>`: update `<daily_folder>` to match Obsidian's value, and update `~/.config/donna/config.md` with the new `daily_folder`. Print `✓ Synced daily folder with Obsidian: <daily_folder>`.
- If `<storage_repo>/.obsidian/` exists but `daily-notes.json` does not exist or has no `folder` field: write `<storage_repo>/.obsidian/daily-notes.json` with `{"folder":"<daily_folder>"}`. Print `✓ Configured Obsidian daily notes to use <daily_folder>/`.
- Otherwise: do nothing.
</step>

<step name="find-daily-file">
Run via Bash to get today's date:
```bash
date +%Y-%m-%d
```

Store the result as `<date>`. Construct the daily file path: `<storage_repo>/<daily_folder>/<date>.md`.

If the file does not exist, print:
```
✗ No daily file for today. Add a task first with /donna:add-task
```
Stop.
</step>

<step name="read-tasks">
Read the daily file with the Read tool.

Find all lines matching the pattern `- [ ] <description>` (open tasks). Collect them as `<open_tasks>`. Do not print the list — it will be shown in the next step via AskUserQuestion.

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
Use AskUserQuestion to ask which task to mark as done. Provide the open task descriptions as options so the user can select from a list. The question text should be:
```
Which task(s) did you finish? (or type something you did that's not on the list)
```

If the user submits without selecting anything or typing anything, print:
```
Nothing selected — nothing to do.
```
Stop.

If the user selects from the list, store the selected task(s) as `<completed_tasks>`.

If the user types free text instead of selecting an option, treat it as a task that was already done: append `- [x] <typed text>` to the daily file (creating it if needed, same as add-task's ensure-daily-file step). Store it as `<completed_tasks>` so the git-commit and confirm steps handle it normally.
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
