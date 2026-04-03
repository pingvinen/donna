# Donna Done Workflow

<objective>
Mark one or more tasks as complete in today's daily journal file and commit the change to git.
</objective>

<step name="init">
Run via Bash:
```bash
INIT=$(node ~/.donna/donna-tools.cjs init)
```

Parse the JSON response. If the `error` field is `"not_configured"`, print:
```
x Donna is not configured. Run /donna:setup first.
```
Stop.

Extract `storage_repo`, `daily_folder`, `auto_push` from the JSON.

If `update_available` is non-null, print:
```
Donna v<update_available> available -- run npx @pingvinen/donna-assistant to update
```
Continue normally.
</step>

<step name="find-daily-file">
Get the daily file path via donna-tools:
```bash
DAILY_PATH=$(node ~/.donna/donna-tools.cjs daily-path | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).path))")
```
Store the result as `<daily_file_path>`. Extract `<date>` from the filename (last path component without `.md`).

If the file does not exist, print:
```
✗ No daily file for today. Add a task first with /donna:add-task
```
Stop.
</step>

<step name="read-tasks">
Read the daily file with the Read tool.

Find all lines matching the pattern `- [ ] <description>` (open tasks). Collect them as `<open_tasks>`. Do not print the list — it will be shown in the next step via AskUserQuestion.

When presenting task descriptions to the user (in the numbered list or match confirmation), strip any leading `(<tool>) ` prefix (tool tag, e.g., `(gh) Review PR #42...` becomes `Review PR #42...`), strip any trailing ` (N times)` suffix (where N is any integer, e.g., `Follow up with Sarah (3 times)` becomes `Follow up with Sarah`), and strip any trailing ` [<text>](<url>)` suffix (e.g., `Review PR #42 [org/repo#42](https://github.com/org/repo/pull/42)` becomes `Review PR #42`) for cleaner display. Keep the full line internally for file operations.

If no open tasks are found, print:
```
✓ All tasks already complete for today!
```
Stop.
</step>

<step name="select-tasks">
Two modes based on whether an argument was provided to this command:

**With argument** (e.g., `/donna:done buy milk`):
When fuzzy-matching task descriptions, strip any trailing ` (N times)` suffix (where N is any integer, matching the regex `\(\d+ times\)`, e.g., `Follow up with Sarah (3 times)` becomes `Follow up with Sarah` for matching purposes). Also strip any leading `(<tool>) ` prefix (tool tag, matching the regex `^\(\w+\) `) and any trailing ` [<text>](<url>)` suffix (source link, matching the regex ` \[[^\]]+\]\([^\)]+\)`, e.g., `(gh) Review PR #42 [org/repo#42](https://github.com/org/repo/pull/42)` becomes `Review PR #42` for matching purposes). These suffixes are added by begin-the-day and are transparent to task completion.

Use your natural language understanding to fuzzy-match the argument against the open task descriptions (after stripping the counter suffix). If a match is found, show it and use AskUserQuestion to confirm:
```
Mark as done: '<task>'? (yes/no)
```
If no match is found, tell the user and list all open tasks.

**Without argument**:
When fuzzy-matching task descriptions, strip any trailing ` (N times)` suffix (where N is any integer, matching the regex `\(\d+ times\)`, e.g., `Follow up with Sarah (3 times)` becomes `Follow up with Sarah` for matching purposes). Also strip any leading `(<tool>) ` prefix (tool tag, matching the regex `^\(\w+\) `) and any trailing ` [<text>](<url>)` suffix (source link, matching the regex ` \[[^\]]+\]\([^\)]+\)`, e.g., `(gh) Review PR #42 [org/repo#42](https://github.com/org/repo/pull/42)` becomes `Review PR #42` for matching purposes). These suffixes are added by begin-the-day and are transparent to task completion.

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

When marking a carry-forward task as complete, strip the ` (N times)` suffix from the completed line. The completed task should read `- [x] Follow up with Sarah` (clean, no counter).

When marking a tool-sourced task as complete, keep both the `(<tool>)` prefix and `[<identifier>](<url>)` suffix on the completed line (they serve as provenance). The completed task should read `- [x] (gh) Review PR #42 [org/repo#42](https://github.com/org/repo/pull/42)` (tool tag and source link preserved for traceability).

Write the updated file with the Write tool.
</step>

<step name="git-commit">
Run via Bash:
```bash
node ~/.donna/donna-tools.cjs commit "donna(done): <task_summary>" --files <daily_folder>/<date>.md
```

Where `<task_summary>` is the completed task description (if one task) or `<N> tasks completed` (if multiple tasks).
</step>

<step name="confirm">
For each completed task, print:
```
✓ Done: <description>
```
</step>
