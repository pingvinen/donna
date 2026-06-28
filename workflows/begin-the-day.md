# Donna Begin-the-Day Workflow

<objective>
Carry forward open tasks from the previous day, surface recurring tasks due today, deduplicate, and present a concise daily brief.
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

Get the daily file path via donna-tools:
```bash
DAILY_PATH=$(node ~/.donna/donna-tools.cjs daily-path | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).path))")
```
Store the result as `<daily_file_path>`.
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

If a previous file was found, read it with the Read tool. Extract open tasks only from the `## Tasks` section — every line matching the pattern `- [ ] <description>` that appears between `## Tasks` and the next `## ` heading (or end of file). Tasks under `## From Tools`, `## Resolved`, or `## Warnings` must NOT be carried forward — tool-sourced tasks are re-pulled fresh each day. For each open task:
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

<step name="check-follow-ups">
Read `<storage_repo>/donna/follow-ups.md` with the Read tool. If the file does not exist, set `<follow_up_tasks>` to an empty list, set `<follow_ups_modified>` to `false`, and continue (follow-ups are optional).

Parse each line matching the pattern `- [ ] <description> | due: YYYY-MM-DD`. For each matching entry:

- Parse the `due` date (YYYY-MM-DD).
- If `due <= <today>`: add to `<follow_up_tasks>` as: `- [ ] <description>` (no annotation).
- If `due > <today>`: task is future — leave the line in follow-ups.md. Do not add to `<follow_up_tasks>`.

After collecting all due/past-due tasks, remove those matched lines from follow-ups.md (the matched lines are NOT written back — only future lines remain). Write the updated file back with the Write tool. If lines were removed, set `<follow_ups_modified>` to `true`. If no lines were removed, set `<follow_ups_modified>` to `false` and skip the file write. Per D-03: items are removed, not checked off or left with a marker.

Store `<follow_up_tasks>` for use in the deduplicate step.

CRITICAL constraints:
- The step reads only one specific named file (`donna/follow-ups.md`) — no directory scan, no wildcard listing
- File existence check is done via the Read tool (handle missing file gracefully)
- macOS date command uses the exact same `date -j` pattern as the existing check-recurring step
- Invalid date strings caught by `date -j`; skip the entry (do not surface, do not remove)
</step>

<step name="pull-tool-data">
Read `<storage_repo>/donna/tools.md` with the Read tool.

If the file does not exist or has no tool sections (no `## ` headers after the frontmatter), set `<tool_tasks>` to an empty list and `<tool_warnings>` to an empty list. Continue to the next step. Do NOT print any error — tools are optional.

Parse each tool section (starting with `## <tool_name>`). For each tool, extract the `type` field (if absent, treat as "cli"), the `command` field (or `base_url` for rest/graphql), and the capabilities list under `### Capabilities`.

Store the parsed tools and their capabilities as `<registered_tools>`.

**If only one tool is registered**, run it directly (no Task spawning needed) using the type-aware execution logic below.

**If multiple tools are registered**, spawn one Task agent per tool. Each agent receives:

- The tool name, type, and its capabilities list
- For REST/GraphQL tools: the base_url, auth_header, and auth_secret fields
- For MCP tools: the capability names with mcp: prefix
- Instructions to execute all capabilities and return results as a structured list
- Instructions to NEVER write to any file or run git commands

**CRITICAL constraints for Task agents:**
- Agents return raw task lists and warnings ONLY
- Agents must NOT write to any file (no Write tool calls to daily file)
- Agents must NOT run git commands (SSH signing constraint from CLAUDE.md)
- All file writing happens in the main workflow after agents return

**Global timeout:** Wait for all Task agents to complete, up to 2 minutes total. After 2 minutes, collect whatever results have been returned and treat non-responding tools as failed with warning: `! <tool_name>: timed out (2-minute batch limit)`.

**Type-aware execution within each agent (or direct execution for single tool):**

For `type: cli` capabilities (format: `<name>: <cli_invocation>`):

Run via Bash (set the Bash tool's `timeout` parameter to `10000`):
```bash
<cli_invocation> 2>&1
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

Add the warning to `<tool_warnings>`. Continue to next capability/tool. Never retry.

For `type: rest` capabilities (format: `<name>: <METHOD> /path`):
1. Read `<storage_repo>/donna/secrets.md` with the Read tool. Parse key-value pairs from under the frontmatter.
2. Resolve the `auth_secret` key to get the actual secret value. If the key is not found in secrets.md or the value is `REPLACE_WITH_YOUR_SECRET`, add warning `! <tool_name>: missing secret <auth_secret> — edit donna/secrets.md` and skip this tool.
3. For each capability, run via Bash (set the Bash tool's `timeout` parameter to `10000`):
```bash
curl -s -H "<auth_header>: <resolved_secret>" "<base_url><path>" 2>&1
```
4. Parse the JSON response using Claude's understanding to extract task-like items. Format:
`- [ ] (<tool_name>) <description> [<identifier>](<url>)`

**On any failure** (non-zero exit, timeout, missing secret):
Add a warning: `! <tool_name>: <error_description>`
Continue. Never retry.

For `type: graphql` capabilities (format: `<name>: <graphql_query>`):
1. Same secrets resolution as REST.
2. For each capability, run via Bash (set the Bash tool's `timeout` parameter to `10000`):
```bash
curl -s -X POST -H "<auth_header>: <resolved_secret>" -H "Content-Type: application/json" -d '{"query":"<graphql_query>"}' "<base_url>" 2>&1
```
3. Parse the JSON response to extract task-like items. Same format as REST.

**On any failure** (non-zero exit, timeout, missing secret):
Add a warning: `! <tool_name>: <error_description>`
Continue. Never retry.

For `type: mcp` capabilities (format: `<name>: mcp:<server>/<tool>`):
1. Invoke the MCP tool directly using Claude's native MCP tool invocation (NOT via Bash).
2. Parse the MCP tool's response using Claude's understanding of the tool to extract task-like items. Format:
`- [ ] (<tool_name>) <description> [<identifier>](<url>)`

**On any failure:**
Add a warning: `! <tool_name>: <error_description>`
Continue. Never retry.

Tool failures must never block manual tasks, carry-forward, or recurring task processing.

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

4. Add `<follow_up_tasks>` as-is — for each follow-up task, normalize its description and check whether any task already in the final list normalizes to the same value. If no match, add it. If a match exists, skip it.

5. Add `<tool_tasks>` as-is — for each tool task, normalize its description and check whether any task already in the final list normalizes to the same value. If no match, add it. If a match exists, skip it.

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
<follow-up tasks not already in existing>

## From Tools
<tool tasks not already in existing — only if there are tool tasks>

## Resolved
<resolved tool tasks — only if there are resolved items>

## Warnings
<tool warnings — only if there are warnings>
```

Tasks are written in this order: existing tasks first (preserving their original order and state), then carried-forward tasks, then recurring tasks, then follow-up tasks.

If `<tool_tasks>` is empty and there are no resolved items, omit the `## From Tools` and `## Resolved` sections entirely.
If `<tool_warnings>` is empty, omit the `## Warnings` section entirely. Each warning is written as-is (e.g., `! jira: command not found — install jira first`).
</step>

<step name="update-recurring-last-run">
If any tasks from `<recurring_tasks>` came from "every other" intervals and were added to today's file, update their `last_run` date in `<storage_repo>/donna/recurring.md`.

Read the full recurring.md file. For each such task, find the line and update the `| last_run: <old_date>` suffix to `| last_run: <today>`. If no `last_run` suffix exists, append ` | last_run: <today>` to the line. Write the full file back with the Write tool.

If no "every other" recurring tasks were added, skip this step.
</step>

<step name="git-commit">
If `<follow_ups_modified>` is `true` (the check-follow-ups step modified follow-ups.md), run via Bash:
```bash
node ~/.donna/donna-tools.cjs commit "donna(daily): <today> daily brief" --files <daily_folder>/<today>.md donna/follow-ups.md
```

Otherwise (follow-ups.md was not modified), run via Bash:
```bash
node ~/.donna/donna-tools.cjs commit "donna(daily): <today> daily brief" --files <daily_folder>/<today>.md
```

Per D-07: follow-ups.md is included in the commit when items were surfaced and removed from the standing file.
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

If there are follow-up tasks (tasks from `<follow_up_tasks>` that were added to the final list), print:
```
## Follow-ups
- [ ] Review design doc
- [ ] Submit expense report
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

Show ALL tasks — never truncate. If no carried-forward tasks, omit the "## Carried Forward" section. If no recurring tasks due today, omit the "## Due Today" section. If no follow-up tasks, omit the "## Follow-ups" section. If no tool tasks, omit the "## From Tools" section. If no tool warnings, omit the "## Warnings" section. If carried-forward, recurring, follow-up, AND tool tasks are all empty and there are no existing tasks, print:
```
No tasks for today — enjoy your day!
```
in place of both sections.
</step>
