# Donna Add-Task Workflow

<objective>
Capture a new task to today's daily journal file in the storage repo and commit it to git.
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

<step name="get-description">
The task description is provided as the argument to this command (e.g., `/donna:add-task buy milk`).

If no argument was provided, use AskUserQuestion to ask:
```
What task would you like to add?
```

Store the response as `<description>`.
</step>

<step name="ensure-daily-file">
Run via Bash to get today's date:
```bash
date +%Y-%m-%d
```

Store the result as `<date>`. Construct the daily file path: `<storage_repo>/daily/<date>.md`.

Run via Bash to ensure the daily/ directory exists:
```bash
mkdir -p <storage_repo>/daily
```

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
git -C <storage_repo> add -A
```

Check whether there is anything to commit:
```bash
git -C <storage_repo> status --porcelain
```

If the output is empty, skip the commit and continue.

Otherwise, run:
```bash
git -C <storage_repo> commit -m "donna(add-task): <description>"
```

If `auto_push` is true in config, also run:
```bash
git -C <storage_repo> push
```
</step>

<step name="confirm">
Print:
```
✓ Added: <description>
```

Also print the path to the daily file: `<storage_repo>/daily/<date>.md`
</step>
