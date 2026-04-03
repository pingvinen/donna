# Donna Add-Task Workflow

<objective>
Capture a new task to today's daily journal file in the storage repo and commit it to git.
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

<step name="get-description">
The task description is provided as the argument to this command (e.g., `/donna:add-task buy milk`).

If no argument was provided, use AskUserQuestion to ask:
```
What task would you like to add?
```

Store the response as `<description>`.
</step>

<step name="ensure-daily-file">
Get the daily file path via donna-tools:
```bash
DAILY_PATH=$(node ~/.donna/donna-tools.cjs daily-path | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).path))")
```
Store the result as `<daily_file_path>`. Extract `<date>` from the filename (last path component without `.md`).

If the daily file does not exist, create it with the Write tool using this content (substituting the actual date):
```markdown
---
date: <date>
---

## Tasks
```
</step>

<step name="append-task">
Read the daily file with the Read tool.

Append `- [ ] <description>` on a new line at the end of the file.

Write the updated file with the Write tool.
</step>

<step name="git-commit">
Run via Bash:
```bash
node ~/.donna/donna-tools.cjs commit "donna(task): added <description>" --files <daily_folder>/<date>.md
```
</step>

<step name="confirm">
Print:
```
✓ Added: <description>
```

Also print the path to the daily file: `<storage_repo>/<daily_folder>/<date>.md`
</step>
