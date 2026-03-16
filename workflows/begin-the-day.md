# Donna Begin-the-Day Workflow

<objective>
Carry forward open tasks from the previous day, surface recurring tasks due today, deduplicate, and present a concise daily brief.
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

<step name="check-pending-migrations">
Read `~/.donna/state.md` with the Read tool. If the file does not exist or has no `pending_migrations` field in its YAML frontmatter, skip this step.

For each entry in `pending_migrations`:

**`move-standing-files`:** Move standing files from storage repo root to donna/ subfolder.

Run via Bash:
```bash
STORAGE_REPO="<storage_repo>"
DONNA_DIR="$STORAGE_REPO/donna"
MOVED=0

mkdir -p "$DONNA_DIR"
for FILE in role.md recurring.md role-research.md; do
    if [ -f "$STORAGE_REPO/$FILE" ] && [ ! -f "$DONNA_DIR/$FILE" ]; then
        mv "$STORAGE_REPO/$FILE" "$DONNA_DIR/$FILE"
        echo "Moved $FILE to donna/$FILE"
        MOVED=$((MOVED + 1))
    fi
done

echo "MOVED=$MOVED"
```

If MOVED > 0, commit the move:
```bash
git -C <storage_repo> add -A
git -C <storage_repo> diff --cached --quiet || git -C <storage_repo> commit -m "donna(migrate): move standing files to donna/ subfolder"
```

If `auto_push` is true in config, also push.

**`backfill-tool-type`:** Add `type: cli` to existing tool sections in tools.md.

Read `<storage_repo>/donna/tools.md` with the Read tool. If the file does not exist or has no tool sections, skip this handler.

For each tool section (starting with `## <tool_name>`), check if a `- type:` line exists between `- command:` and `- version:`. If the `- type:` line is missing, insert `- type: cli` immediately after the `- command:` line.

Write the updated file back with the Write tool. If any changes were made, commit:
```bash
git -C <storage_repo> add -A
git -C <storage_repo> diff --cached --quiet || git -C <storage_repo> commit -m "donna(migrate): backfill type: cli on existing tools"
```

If `auto_push` is true in config, also push.

After processing all pending migrations, update `~/.donna/state.md` with the Write tool: remove the completed entries from `pending_migrations`. If no entries remain, write:
```markdown
---
pending_migrations: []
---
```
</step>

<step name="get-today">
Run via Bash to get today's date, day-of-week, and day-of-month:
```bash
date +%Y-%m-%d
```
Store the result as `<today>`.

```bash
date +%A
```
Store the result as `<day_of_week>` (e.g., "Monday").

```bash
date +%-d
```
Store the result as `<day_of_month>` (e.g., "1" for the 1st).

Construct the daily file path: `<storage_repo>/<daily_folder>/<today>.md`.
</step>

<step name="find-previous-file">
Find the most recent previous daily file. Run via Bash:
```bash
TODAY=$(date +%Y-%m-%d)
DAILY_DIR="<storage_repo>/<daily_folder>"
PREV_FILE=$(ls "$DAILY_DIR"/*.md 2>/dev/null | sort | grep -v "$TODAY" | tail -1)
echo "${PREV_FILE:-NONE}"
```

CRITICAL: The `grep -v "$TODAY"` exclusion prevents a self-referencing loop. If the result is "NONE", there is no previous file — skip the carry-forward step. This reads a directory listing only (satisfies STORE-03), then reads at most ONE previous file.
</step>

<step name="carry-forward">
If the previous file result is "NONE", set `<carried_tasks>` to an empty list and continue to the next step.

If a previous file was found, read it with the Read tool. Extract all open tasks — every line matching the pattern `- [ ] <description>`. For each open task:
- If the description ends with ` (N times)` (where N is any integer): extract N, increment to N+1, replace the suffix with ` (N+1 times)`. For example: `- [ ] Follow up with Sarah (2 times)` becomes `- [ ] Follow up with Sarah (3 times)`.
- If the description has no such suffix: append ` (1 times)`. For example: `- [ ] Follow up with Sarah` becomes `- [ ] Follow up with Sarah (1 times)`.

Store the resulting list as `<carried_tasks>`.

Do NOT modify the previous file — it is a historical record and must remain unchanged.
</step>

<step name="check-recurring">
Read `<storage_repo>/donna/recurring.md` with the Read tool. If the file does not exist, set `<recurring_tasks>` to an empty list and continue (recurring tasks are optional — set-role may not have been run yet).

Parse each line matching the pattern `- <description>: <interval>`. For "every other" intervals, also parse the `| last_run: YYYY-MM-DD` suffix.

For each task, determine if it is due today using this logic:
- `every <DayName>` (e.g., "every Monday"): due if `<day_of_week>` matches DayName
- `every weekday`: due if `<day_of_week>` is Monday, Tuesday, Wednesday, Thursday, or Friday
- `first <DayName> of month`: due if `<day_of_week>` matches DayName AND `<day_of_month>` <= 7
- `every other <DayName>` with `| last_run: YYYY-MM-DD`: due if `<day_of_week>` matches DayName AND days since last_run >= 14. Use macOS-compatible date arithmetic:
  ```bash
  LAST_RUN="<last_run_date>"
  last_run_epoch=$(date -j -f "%Y-%m-%d" "$LAST_RUN" "+%s")
  today_epoch=$(date +%s)
  days=$(( (today_epoch - last_run_epoch) / 86400 ))
  echo "$days"
  ```

Store the descriptions of all due tasks as `<recurring_tasks>` (just the description text, without the interval suffix).
</step>

<step name="pull-tool-data">
Read `<storage_repo>/donna/tools.md` with the Read tool.

If the file does not exist or has no tool sections (no `## ` headers after the frontmatter), set `<tool_tasks>` to an empty list and `<tool_warnings>` to an empty list. Continue to the next step. Do NOT print any error — tools are optional.

For each tool section in tools.md, parse the `type` field (if absent, treat as "cli"), the `command` field, and the `### Capabilities` entries. For each capability entry (format: `- <name>: <cli_invocation>`):

Run the CLI invocation via Bash with a 10-second timeout:
```bash
timeout 10 <cli_invocation> 2>&1
```

**On success (exit 0):**
Parse the output into task entries. Every task line MUST include both a tool tag and a descriptive link.

CRITICAL — tool tag format: Every tool task line MUST start with `(<tool_name>)` after the checkbox, where `<tool_name>` is the `## <tool_name>` section header from tools.md (e.g., `gh`, `jira`, `kubectl`). This tag identifies which tool sourced the task. Example: if processing the `## gh` section, every task line starts with `- [ ] (gh) `.

For `gh` JSON output (`--json number,title,url`): parse the JSON array. Extract `<owner>/<repo>` from the `url` field (e.g., `https://github.com/acme/api/pull/42` → `acme/api`). For each item, create:
`- [ ] (gh) <title> [<owner/repo>#<number>](<url>)`

For `jira` plain output: parse each row. For each issue, create:
`- [ ] (jira) <summary> [<key>](https://<jira_host>/browse/<key>)`
Note: jira plain output may not include URLs — if the URL is not available, use the issue key only: `- [ ] (jira) <summary> [<key>](<key>)`

For other tools: use Claude's understanding to extract task-like items from the output. Format with a descriptive identifier as the link text and URL if available:
`- [ ] (<tool_name>) <description> [<identifier>](<url>)`

**On failure (non-zero exit):**
Determine the failure type from the exit code and output:
- Exit 124: `! <tool_name>: timed out after 10s — check network connectivity`
- Exit 1 with "auth" or "login" in output: `! <tool_name>: authentication failed — run \`<auth_fix_command>\``
- Exit 127 or "not found" in output: `! <tool_name>: command not found — install <command> first`
- Other: `! <tool_name>: <first line of stderr>`

Add the warning to `<tool_warnings>`. Continue to next capability/tool. Never retry. Tool failures must never block manual tasks, carry-forward, or recurring task processing.

Collect all task entries as `<tool_tasks>`.
Collect all warning messages as `<tool_warnings>`.
</step>

<step name="read-existing-today">
If today's daily file already exists, read it with the Read tool. Extract all task lines — both open (`- [ ] ...`) and closed (`- [x] ...`). Store as `<existing_tasks>`.

If the file does not exist, `<existing_tasks>` is an empty list.
</step>

<step name="deduplicate">
Assemble the full task list using a single-pass deduplication to ensure idempotency:

**Normalization for comparison:** strip `- [ ] ` or `- [x] ` prefix, strip any leading `(<tool>) ` prefix (tool tag, matching the pattern `\(\w+\) `), strip any trailing ` (N times)` suffix (where N is any integer), strip any trailing ` [<text>](<url>)` suffix (tool source link, matching the pattern ` \[[^\]]+\]\([^\)]+\)`), strip any trailing ` (<reason>)` suffix (e.g. `(merged)`, `(closed)`), lowercase all text, trim whitespace.

1. Start with `<existing_tasks>` — both open and closed tasks take priority. Add them all to the final list.

2. Add `<carried_tasks>` — for each carried task, normalize its description and check whether any task already in the final list (from existing_tasks) normalizes to the same value. If no match, add it. If a match exists, skip it.

3. Add `<recurring_tasks>` as `- [ ] <description>` — for each recurring task, normalize its description and check whether any task already in the final list normalizes to the same value. If no match, add it. If a match exists, skip it.

4. Add `<tool_tasks>` as-is — for each tool task, normalize its description and check whether any task already in the final list normalizes to the same value. If no match, add it. If a match exists, skip it.

CRITICAL: A closed task `- [x] Review PRs` must block a recurring `- [ ] Review PRs` from being re-added. Both open AND closed existing tasks count for deduplication.

CRITICAL: A closed task `- [x] (gh) Review PR #42 [acme/api#42](https://...)` must block a tool task `- [ ] (gh) Review PR #42 [acme/api#42](https://...)` from being re-added. The normalization (strip tool tag + source link) ensures both normalize to "review pr #42".

CRITICAL: If a carried-forward task already exists in today's file (from a previous run of begin-the-day today), do not re-add it or re-increment its counter. The normalization (strip suffix) ensures this.

Store the result as `<final_tasks>`.
</step>

<step name="write-daily-file">
Ensure the daily folder exists:
```bash
mkdir -p <storage_repo>/<daily_folder>
```

Write today's daily file with the Write tool. Content format:
```markdown
---
date: <today>
---

## Tasks
<existing tasks, preserving their original order and open/closed state>
<carried-forward tasks not already in existing>
<recurring tasks not already in existing>

## From Tools
<tool tasks not already in existing — only if there are tool tasks>

## Resolved
<resolved tool tasks — only if there are resolved items>

## Warnings
<tool warnings — only if there are warnings>
```

Tasks are written in this order: existing tasks first (preserving their original order and state), then carried-forward tasks, then recurring tasks.

If `<tool_tasks>` is empty and there are no resolved items, omit the `## From Tools` and `## Resolved` sections entirely.
If `<tool_warnings>` is empty, omit the `## Warnings` section entirely. Each warning is written as-is (e.g., `! jira: command not found — install jira first`).
</step>

<step name="update-recurring-last-run">
If any tasks from `<recurring_tasks>` came from "every other" intervals and were added to today's file, update their `last_run` date in `<storage_repo>/donna/recurring.md`.

Read the full recurring.md file. For each such task, find the line and update the `| last_run: <old_date>` suffix to `| last_run: <today>`. If no `last_run` suffix exists, append ` | last_run: <today>` to the line. Write the full file back with the Write tool.

If no "every other" recurring tasks were added, skip this step.
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
git -C <storage_repo> commit -m "donna(begin-the-day): daily brief for <today>"
```

If `auto_push` is true in config, also run:
```bash
git -C <storage_repo> push
```
</step>

<step name="print-brief">
Print the daily brief to the terminal:
```
══════════════════════════════════════
 Donna — Daily Brief for <today>
══════════════════════════════════════
```

If there are carried-forward tasks (tasks from `<carried_tasks>` that were added to the final list), print:
```
## Carried Forward
- [ ] Follow up with Sarah (3 times)
- [ ] Review design doc (1 times)
```

If there are recurring tasks due today (tasks from `<recurring_tasks>` that were added to the final list), print:
```
## Due Today
- [ ] Check team Slack
- [ ] Review sprint backlog
```

If there are tool tasks (tasks from `<tool_tasks>` that were added to the final list), print:
```
## From Tools
- [ ] (gh) Review PR #42 [org/repo#42](https://github.com/org/repo/pull/42)
- [ ] (jira) Implement AUTH-07 [AUTH-07](https://company.atlassian.net/browse/AUTH-07)
```

If there are tool warnings (`<tool_warnings>` is not empty), print:
```
## Warnings
! gh: authentication failed — run `gh auth login`
```

Always end with:
```
══════════════════════════════════════
```

Show ALL tasks — never truncate. If no carried-forward tasks, omit the "## Carried Forward" section. If no recurring tasks due today, omit the "## Due Today" section. If no tool tasks, omit the "## From Tools" section. If no tool warnings, omit the "## Warnings" section. If carried-forward, recurring, AND tool tasks are all empty and there are no existing tasks, print:
```
No tasks for today — enjoy your day!
```
in place of both sections.
</step>
