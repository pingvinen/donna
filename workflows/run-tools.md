# Donna Run-Tools Workflow

<objective>
Execute all configured external tool commands, pull fresh data, and smart-merge results into today's daily file. Does not run the full begin-the-day carry-forward or recurring task logic — this is a mid-day update only.
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

<step name="read-tools-md">
Read `<storage_repo>/donna/tools.md` with the Read tool. If the file does not exist, print:
```
✗ No tools registered. Run /donna:add-tool first.
```
Stop.

Parse each tool section (starting with `## <tool_name>`). For each tool, extract the `type` field (if absent, treat as "cli"), the `command` field, and the capabilities list under `### Capabilities`.

Store the parsed tools and their capabilities as `<registered_tools>`.
</step>

<step name="find-daily-file">
Get the daily file path via donna-tools:
```bash
DAILY_PATH=$(node ~/.donna/donna-tools.cjs daily-path | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).path))")
```
Store the result as `<daily_file_path>`. Extract `<today>` from the filename (last path component without `.md`).

If the file does not exist, print:
```
✗ No daily file for today. Run /donna:begin-the-day first.
```
Stop.
</step>

<step name="read-existing-tool-tasks">
Read today's daily file with the Read tool.

Extract all lines from the `## From Tools` section and the `## Resolved` section.

For each line, extract the embedded URL from the `[<text>](<url>)` pattern — this URL is the stable identifier for matching. Store as `<existing_tool_lines>`: a map of URL to full line (including its checkbox state `[ ]` or `[x]` and tool tag).

If the `## From Tools` section does not exist in today's file, set `<existing_tool_lines>` to an empty map. The section will be created during smart-merge.
</step>

<step name="pull-fresh-data">
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

Run the capability command via Bash (set the Bash tool's `timeout` parameter to `10000`):
```bash
<capability_command> 2>&1
```

**On success (exit 0):** Parse the output into task entries. Every task line MUST include both a tool tag and a descriptive link.

CRITICAL — tool tag format: Every tool task line MUST start with `(<tool_name>)` after the checkbox, where `<tool_name>` is the `## <tool_name>` section header from tools.md (e.g., `gh`, `jira`, `kubectl`). This tag identifies which tool sourced the task. Example: if processing the `## gh` section, every task line starts with `- [ ] (gh) `.

For gh JSON output, extract `number`, `title`, `url` fields from each JSON object. Use the `url` field as the stable identifier. Extract `<owner>/<repo>` from the URL (e.g., `https://github.com/acme/api/pull/42` → `acme/api`). Format:
```
- [ ] (gh) <title> [<owner/repo>#<number>](<url>)
```

For jira plain output, extract the issue key and summary from each line. Format:
```
- [ ] (jira) <summary> [<issue_key>](https://jira.company.com/browse/<issue_key>)
```

For other tools: use Claude's understanding to extract task-like items from the output. Format with a descriptive identifier as the link text and URL if available:
```
- [ ] (<tool_name>) <description> [<identifier>](<url>)
```

**On failure (exit non-zero, including exit 124 for timeout):** Add a warning:
```
! <tool_name>: <error_description>
```
Continue to the next capability. Never retry.

For `type: rest` capabilities (format: `<name>: <METHOD> /path`):
1. Resolve the auth secret via Bash:
```bash
node ~/.donna/donna-tools.cjs resolve-secret <auth_secret>
```
2. Parse the JSON response. If `error` is `"key_not_found"` or `"placeholder_value"`, add warning `! <tool_name>: missing secret <auth_secret> — edit donna/secrets.md` and skip this tool. Otherwise extract the `value` field as `<resolved_secret>`.
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

Store all fresh tasks as `<fresh_tool_tasks>`: a map of URL to task line.
Collect all warning messages as `<tool_warnings>`.
</step>

<step name="smart-merge">
Apply three-way merge rules in priority order. This is a read-modify-write operation — the entire daily file is rewritten atomically with all sections updated.

Read the full current content of today's daily file.

**Process existing tool lines** (from `<existing_tool_lines>`):

For each URL in `<existing_tool_lines>`:
1. If the line is `[x]` (user manually checked): **KEEP AS-IS** — user intent wins (Rule 1). Do not change regardless of tool state.
2. If the line is `[ ]` AND the URL exists in `<fresh_tool_tasks>`: **KEEP OPEN** — item is still active (Rule 2).
3. If the line is `[ ]` AND the URL is NOT in `<fresh_tool_tasks>`: the item was removed from the tool (reassigned, deleted, or closed).
   - For gh items: check if the PR/issue was closed or merged via Bash (set the Bash tool's `timeout` parameter to `10000`): `gh pr view <number> --json state --jq '.state' 2>/dev/null || gh issue view <number> --json state --jq '.state' 2>/dev/null`
   - If closed or merged: change to `- [x] (<tool>) <description> [<identifier>](<url>) (<reason>)` and move to `## Resolved` (Rule 3a).
   - If status check fails or item simply no longer appears: move to `## Resolved` with `(removed)` (Rule 3b).

**Add new items** (from `<fresh_tool_tasks>`):

For each URL in `<fresh_tool_tasks>` that is NOT in `<existing_tool_lines>`:
- **ADD** the task line to the `## From Tools` section (Rule 4 — new item).

**Rebuild the file:**

Rewrite today's daily file with the Write tool, preserving all non-tool sections exactly. The `## From Tools` section contains only currently open tool tasks. The `## Resolved` section contains closed/removed items appended to any existing resolved items.

CRITICAL: Remove items from `## From Tools` when moving them to `## Resolved`. Do NOT just append. The entire file is rewritten in one Write operation.

If `## From Tools` does not yet exist in the file, add it after the `## Tasks` section. If `## Resolved` does not yet exist, add it at the end of the file when needed.
</step>

<step name="git-commit">
Run via Bash:
```bash
node ~/.donna/donna-tools.cjs commit "donna(tools): refreshed tool data" --files <daily_folder>/<today>.md
```
</step>

<step name="print-summary">
Print:
```
══════════════════════════════════════
 Donna — Run Tools for <today>
══════════════════════════════════════
```

If new tasks were added (Rule 4), print each new task line.
If tasks were auto-closed (Rule 3a), print each with reason.
If tasks were moved to Resolved (Rule 3b), print each with reason.
If there are warnings from `<tool_warnings>`, print each warning line.
If nothing changed, print:
```
No changes from tools.
```

End with:
```
══════════════════════════════════════
```
</step>
