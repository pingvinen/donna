# Donna Focus Workflow

<objective>
Read today's daily file, score open tasks on urgency and context signals, optionally re-query active tools for enriched data, and produce a short prioritized focus list written to daily/focus.md and printed to the terminal. This is a read-only operation relative to the daily file: only focus.md is written.
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

**`backfill-tool-type`:** Backfill `type` on existing tool sections in tools.md using heuristic detection.

Read `<storage_repo>/donna/tools.md` with the Read tool. If the file does not exist or has no tool sections, skip this handler.

For each tool section (starting with `## <tool_name>`), check if a `- type:` line already exists. If the `- type:` line is missing, detect the correct type:

1. If the tool section contains a `- command:` line where the value starts with `mcp:` (e.g., `- command: mcp:linear`), insert `- type: mcp` immediately after the `- command:` line.
2. Else, if the tool section contains a `- base_url:` line:
   - If the capabilities section contains entries that look like GraphQL queries (contain `query {` or `mutation {`), insert `- type: graphql` immediately after `## <tool_name>` (REST/GraphQL tools have no `- command:` line).
   - Otherwise, insert `- type: rest` immediately after `## <tool_name>`.
3. Else (no `mcp:` prefix, no `base_url` field), insert `- type: cli` immediately after the `- command:` line.

Write the updated file back with the Write tool. If any changes were made, commit:
```bash
git -C <storage_repo> add -A
git -C <storage_repo> diff --cached --quiet || git -C <storage_repo> commit -m "donna(migrate): backfill tool types on existing tools"
```

If `auto_push` is true in config, also push.

After processing all pending migrations, update `~/.donna/state.md` with the Write tool: remove the completed entries from `pending_migrations`. If no entries remain, write:
```markdown
---
pending_migrations: []
---
```
</step>

<step name="read-daily-file">
Get today's date via Bash:
```bash
date +%Y-%m-%d
```
Store as `<today>`.

Construct the daily file path: `<storage_repo>/<daily_folder>/<today>.md`.

Read the daily file with the Read tool. If the file does not exist, print:
```
✗ No daily file for today. Run /donna:begin-the-day first.
```
Stop.

Store the file content as `<daily_content>`.
</step>

<step name="parse-open-tasks">
Extract all lines from `<daily_content>` matching `- [ ] ` (open tasks only — do NOT include closed `- [x]` tasks per D-12).

Store as `<open_tasks>` list. Count the total number of open items as `<total_open_count>` (used for the footer per D-18).

For each open task line, parse the following components:
- **Tool tag:** leading `(<tool_tag>) ` if present — regex `\(\w+\) ` appearing after `- [ ] `
- **Carry-forward count:** trailing ` (N times)` suffix where N is an integer >= 1. If present, extract N. If absent, this item is "new today" (D-11 freshness signal).
- **URL/identifier:** trailing ` [<text>](<url>)` link pattern
- **Description text:** everything between the tool tag (if any) and the trailing suffixes

For scoring purposes, classify each item:
- Has urgency keyword (case-insensitive scan of description + tool tag): "due today", "due tomorrow", "blocking", "urgent", "ASAP" → urgency_signal = HIGH
- Has `(N times)` with N >= 5 → chronic_neglect_signal = HIGH
- Has `(N times)` with 1 <= N < 5 → carry_signal = MEDIUM
- Has no `(N times)` suffix → freshness_signal = MILD (new today)

Store the parsed open tasks as `<open_tasks>` — each entry retaining the full original line plus parsed components.
</step>

<step name="enrich-from-tools">
Collect the unique tool tags from `<open_tasks>` (e.g., `gh`, `jira`). If no tool tags are present in any open task, skip this step and set `<enriched_data>` to an empty map.

Read `<storage_repo>/donna/tools.md` with the Read tool. If the file does not exist, skip this step (tools are optional).

For each unique tool tag found in `<open_tasks>`, find the matching `## <tool_name>` section in tools.md where `<tool_name>` matches the tag. If no matching section is found, skip that tool.

For each matched tool, extract:
- `type` field (default `cli` if absent)
- `command` field (for cli tools)
- `base_url`, `auth_header`, `auth_secret` fields (for rest/graphql tools)
- Capabilities list under `### Capabilities`

**If only one tool tag is found**, run it directly (no Task spawning needed) using the type-aware execution logic below.

**If multiple tool tags are found**, spawn one Task agent per tool. Each agent receives:
- The tool name, type, and its capabilities list
- For REST/GraphQL tools: the base_url, auth_header, and auth_secret fields
- For MCP tools: the capability names with mcp: prefix
- Instructions to execute all capabilities and return results as a structured list
- Instructions to NEVER write to any file or run git commands

**CRITICAL constraints for Task agents:**
- Agents return raw task lists and enrichment data ONLY
- Agents must NOT write to any file (no Write tool calls)
- Agents must NOT run git commands (SSH signing constraint from CLAUDE.md)
- DO NOT run git commands
- All file writing happens in the main workflow after agents return

**Global timeout:** Wait for all Task agents to complete, up to 2 minutes total. After 2 minutes, collect whatever results have been returned and treat non-responding tools as failed with warning: `! <tool_name>: timed out (2-minute batch limit)`.

**Type-aware execution within each agent (or direct execution for single tool):**

For `type: cli` capabilities (format: `<name>: <cli_invocation>`):

Run via Bash (set the Bash tool's `timeout` parameter to `10000`):
```bash
<cli_invocation> 2>&1
```

For `type: rest` capabilities (format: `<name>: <METHOD> /path`):
1. Read `<storage_repo>/donna/secrets.md` with the Read tool. Parse key-value pairs from under the frontmatter.
2. Resolve the `auth_secret` key to get the actual secret value. If the key is not found in secrets.md or the value is `REPLACE_WITH_YOUR_SECRET`, add warning `! <tool_name>: missing secret <auth_secret> — edit donna/secrets.md` and skip this tool.
3. For each capability, run via Bash (set the Bash tool's `timeout` parameter to `10000`):
```bash
curl -s -H "<auth_header>: <resolved_secret>" "<base_url><path>" 2>&1
```

For `type: graphql` capabilities (format: `<name>: <graphql_query>`):
1. Same secrets resolution as REST.
2. For each capability, run via Bash (set the Bash tool's `timeout` parameter to `10000`):
```bash
curl -s -X POST -H "<auth_header>: <resolved_secret>" -H "Content-Type: application/json" -d '{"query":"<graphql_query>"}' "<base_url>" 2>&1
```

For `type: mcp` capabilities (format: `<name>: mcp:<server>/<tool>`):
1. Invoke the MCP tool directly using Claude's native MCP tool invocation (NOT via Bash).

**On any tool failure (exit non-zero, timeout, missing secret):** Log warning `! <tool_name>: <error_description>`, continue with text-only signals for that tool's items (D-15 graceful fallback). Never retry.

Store enriched results as `<enriched_data>`: a map keyed by tool tag, containing the fresh task list and any status metadata returned (PR review state, Jira status, etc.).
Collect all warning messages as `<tool_warnings>`.
</step>

<step name="score-and-rank">
Apply priority signals to each open task in `<open_tasks>` (per D-08 through D-12):

**Text-analysis signals (always applied):**

1. **Urgency keywords (D-08, HIGH signal):** Scan the full task line (case-insensitive) for: "due today", "due tomorrow", "blocking", "urgent", "ASAP". Any match elevates this item to the top tier.

2. **Chronic neglect (D-09, HIGH signal):** Items with `(N times)` where N >= 5 have been ignored repeatedly — elevated priority. These are chronically neglected tasks that demand attention.

3. **Carry-forward (D-09, MEDIUM signal):** Items with `(N times)` where 1 <= N < 5 have been carried forward — moderate priority increase based on how long they've been open.

4. **Freshness (D-11, MILD signal):** Items WITHOUT a `(N times)` suffix are new today. Mild positive signal — they are fresh and haven't been neglected yet.

5. **Open state (D-12):** Already filtered in the parse step — only open items reach scoring.

**Tool enrichment signals (D-14, applied when `<enriched_data>` is available):**

For each open task with a tool tag, look up the corresponding item in `<enriched_data>`:
- PR with review-requested status: elevated priority (action needed from user)
- PR with changes-requested: elevated priority (blocking the PR author)
- PR that is mergeable/approved: moderate signal (quick win)
- Jira item "In Progress": moderate signal (active work)
- Jira item "Blocked": elevated priority
- Any status indicating action is needed from the user: elevated priority

**Ranking:**

Claude selects 3–8 items dynamically based on the urgency distribution (D-17):
- On a quiet day with few urgent items: show 3–4 items
- On a busy day with many urgent items: show up to 8 items
- The goal is a focused, actionable list — not a comprehensive one

Produce `<focus_items>` as an ordered list. Each item includes:
- The original task description (clean, without state prefix)
- A reason tag explaining why it was prioritized (e.g., "due today", "review requested", "urgent", "carried 8 times", "new today", "blocking")

The count of items NOT included in the focus list is: `<other_count>` = `<total_open_count>` - count of `<focus_items>`.
</step>

<step name="write-focus-file">
Get the current time via Bash:
```bash
date +%H:%M
```
Store as `<generated_time>`.

Write to `<storage_repo>/<daily_folder>/focus.md` with the Write tool (D-04, D-06, D-07). The file is overwritten entirely each run.

File content format:
```markdown
---
date: <today>
generated: <generated_time>
---

## Focus (<today>, <generated_time>)

1. <item description> — <reason tag>
2. <item description> — <reason tag>
...

---
<other_count> other items in today's file
```

CRITICAL: Only write to `<storage_repo>/<daily_folder>/focus.md`. NEVER modify the daily file `<storage_repo>/<daily_folder>/<today>.md`.

If there are tool warnings from `<tool_warnings>`, append them after the footer:
```markdown
---
<other_count> other items in today's file

## Warnings
! <tool_name>: <warning>
```
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
git -C <storage_repo> commit -m "donna(focus): focus list for <today>"
```

If `auto_push` is true in config, also run:
```bash
git -C <storage_repo> push
```
</step>

<step name="print-focus">
Print to the terminal with banner, following the begin-the-day pattern:

```
══════════════════════════════════════
 Donna — Focus for <today>
══════════════════════════════════════
```

Then print each focus item numbered, with reason tag:
```
1. <item description> — <reason tag>
2. <item description> — <reason tag>
...
```

Then print the footer:
```
---
<other_count> other items in today's file
```

If there are tool warnings from `<tool_warnings>`, print each warning:
```
! <tool_name>: <warning>
```

End with the closing banner line:
```
══════════════════════════════════════
```
</step>
