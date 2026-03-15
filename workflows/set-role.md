# Donna Set-Role Workflow

<objective>
Define the user's job role, research recurring tasks and tools for that role using WebSearch, present findings for approval, and persist role definition and recurring tasks to the storage repo.
</objective>

<step name="read-config">
Read `~/.config/donna/config.md`.

If the file does not exist, print:
```
✗ Donna is not configured. Run /donna:setup first.
```
Stop.

Extract the `storage_repo` and `auto_push` (default: false) fields from the YAML frontmatter.
</step>

<step name="migrate-standing-files">
Check if standing files exist at the old location (repo root) and move them to donna/ if needed.

Run via Bash:
```bash
STORAGE_REPO="<storage_repo>"
DONNA_DIR="$STORAGE_REPO/donna"

# Only migrate if donna/ doesn't exist yet but root-level standing files do
if [ ! -d "$DONNA_DIR" ] || [ -f "$STORAGE_REPO/role.md" ] || [ -f "$STORAGE_REPO/recurring.md" ] || [ -f "$STORAGE_REPO/role-research.md" ]; then
    mkdir -p "$DONNA_DIR"
    for FILE in role.md recurring.md role-research.md config.md; do
        if [ -f "$STORAGE_REPO/$FILE" ] && [ ! -f "$DONNA_DIR/$FILE" ]; then
            mv "$STORAGE_REPO/$FILE" "$DONNA_DIR/$FILE"
            echo "Moved $FILE to donna/$FILE"
        fi
    done
fi
```

If any files were moved, run:
```bash
git -C <storage_repo> add -A
git -C <storage_repo> diff --cached --quiet || git -C <storage_repo> commit -m "donna(migrate): move standing files to donna/ subfolder"
```

If `auto_push` is true in config, also push.
</step>

<step name="check-existing-role">
Run via Bash:
```bash
test -f <storage_repo>/donna/role.md && echo "exists" || echo "missing"
```

If the output is "exists", proceed to the rerun-menu step.
If the output is "missing", proceed to the ask-role step.
</step>

<step name="rerun-menu">
Use AskUserQuestion to present the re-run menu:

```
A role definition already exists. What would you like to do?

1. Something got messed up — start fresh (reset)
2. Got promoted or changed roles — update (diff-update)
3. Just want to refresh the research — re-research current role
4. Cancel
```

- On "reset" (option 1): proceed to ask-role (fresh start, will overwrite role.md and recurring.md).
- On "diff-update" (option 2): read current `<storage_repo>/donna/role.md` with the Read tool, proceed to ask-role but pre-fill with current values and note this is an update. After research, show delta (added/removed recurring tasks vs current `<storage_repo>/donna/recurring.md`). Preserve any manually-added recurring tasks (tasks in recurring.md not in the research suggestions).
- On "re-research" (option 3): read current `<storage_repo>/donna/role.md` with the Read tool to get the existing role data, skip to the research step.
- On "Cancel" (option 4): print "Cancelled." and stop.
</step>

<step name="ask-role">
Stage 1: Collect role details interactively.

Use AskUserQuestion to ask the following questions in sequence:

1. "What is your job title?" — store as `<job_title>`.
2. "How large is your team? How many direct reports do you have? (e.g. team of 8, 3 direct reports)" — store as `<team_info>`.
3. "What are 2–3 things you focus on most in your role? (e.g. sprint planning, hiring, technical architecture)" — store as `<key_responsibilities>`.

Parse `<team_info>` into `<team_size>` (total team) and `<direct_reports>` (direct reports count) as best you can.
Parse `<key_responsibilities>` into an array of 2–3 items.

Store all values for use in subsequent steps.
</step>

<step name="research">
Stage 2: Research the role using WebSearch.

Construct targeted queries using ALL collected data from Stage 1. Run 2–3 focused searches:

1. `<job_title> daily recurring tasks responsibilities`
2. `<job_title> <key_responsibilities[0]> common tools workflows`
3. (optional) `<job_title> weekly monthly recurring tasks best practices`

Use WebSearch for each query. Synthesize findings into a structured summary matching the role-research.md format:

- **Daily tasks**: recurring things done every workday
- **Weekly tasks**: recurring things done each week
- **Monthly tasks**: recurring things done each month
- **Tool suggestions**: tools commonly used for this role (with brief descriptions)

Tailor suggestions to the specific responsibilities the user described — avoid generic results that don't reflect their actual focus areas.
</step>

<step name="present-summary">
Print a concise summary of research findings (2–3 sentences covering the key patterns found).

Then use AskUserQuestion:
```
Which category would you like to review?
1. Recurring tasks
2. Tool suggestions
3. Both
4. Skip (accept all recurring tasks as-is)
```

Store the choice for subsequent steps.
</step>

<step name="approve-recurring">
If the user chose to review recurring tasks (options 1 or 3):

Display each category in turn (daily, weekly, monthly) and use AskUserQuestion for each task:
```
[Daily] Check team Slack and unblock blockers
→ Approve, reject, or modify? (approve / reject / [type modification)
```

Interpret modifications naturally:
- "make this biweekly" → change interval to "every other week"
- "every other Monday" → interval becomes "every other Monday"
- "first Monday of the month" → interval becomes "first Monday of month"

After reviewing all categories, ask: "Would you like to add any recurring tasks I missed?" Accept free-text additions.

Collect the final approved list with their intervals.

If the user chose to skip (option 4): accept all suggested recurring tasks with their default intervals.
</step>

<step name="approve-tools">
If the user chose to review tool suggestions (options 2 or 3):

Display each tool suggestion and use AskUserQuestion:
```
Tool: Jira (sprint management)
→ Note this for future configuration? (yes / no)
```

For noted tools, print:
```
✓ Noted: <tool name>. Run /donna:add-tool to configure <tool name> (available in a future update).
```

Do NOT create tools.md or configure anything — only note the user's interest.
</step>

<step name="save-role">
Write `<storage_repo>/donna/role.md` with the Write tool.

Use this format (substituting actual values):
```markdown
---
job_title: <job_title>
team_size: <team_size>
direct_reports: <direct_reports>
key_responsibilities:
  - <responsibility 1>
  - <responsibility 2>
updated: <today's date in YYYY-MM-DD format>
---

# Role: <job_title>

[Write a 2–3 sentence prose summary of the role as described by the user, incorporating their key responsibilities and team context.]
```

Write `<storage_repo>/donna/role-research.md` with the Write tool.

Use this format:
```markdown
---
researched: <today's date in YYYY-MM-DD format>
role: <job_title>
---

# Role Research: <job_title>

## Summary
[2–3 sentence overview of what the research found for this role]

## Recurring Task Suggestions

### Daily
[List daily task suggestions from research]

### Weekly
[List weekly task suggestions from research]

### Monthly
[List monthly task suggestions from research]

## Tool Suggestions
[List tool suggestions with brief descriptions]

## Notes
[Any additional context from research relevant to this specific role]
```
</step>

<step name="save-recurring">
Write `<storage_repo>/donna/recurring.md` with the Write tool.

Format: one approved recurring task per line as `- Task description: interval`.
For "every other" intervals (biweekly, every other Monday, etc.), append ` | last_run: <today's date>` suffix.

Use this format:
```markdown
---
# Recurring tasks — managed by donna:set-role
---

- <task 1>: <interval 1>
- <task 2>: <interval 2>
- <task 3>: <interval 3> | last_run: <today's date>
```

If this is a diff-update (user chose option 2 in rerun-menu):
1. Read the existing `<storage_repo>/donna/recurring.md` with the Read tool.
2. Identify manually-added tasks: tasks in recurring.md that were NOT in the research suggestions.
3. Merge: keep manually-added tasks, add new approved tasks, remove tasks the user rejected.
4. Write the merged result.
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
git -C <storage_repo> commit -m "donna(set-role): define role as <job_title>"
```

If `auto_push` is true in config, also run:
```bash
git -C <storage_repo> push
```
</step>

<step name="confirm">
Print:
```
✓ Role defined: <job_title>
✓ <N> recurring tasks saved to recurring.md
✓ Research saved to role-research.md
```

If any tools were noted during approve-tools, remind:
```
→ Run /donna:add-tool to configure your noted tools (available in a future update).
```
</step>
