# Donna Relearn-Tools Workflow

<objective>
Check each registered tool's installed version against its stored version and re-learn capabilities for tools that have been updated. Tools at the same version are skipped.
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

Parse each tool section (starting with `## <tool_name>`). For each tool, extract:
- `command` — the CLI command to run (CLI/MCP tools only)
- `type` — the tool type field (if absent, treat as "cli")
- `version` — the stored version string (CLI tools only)
- `learned` — the date capabilities were last learned
- `base_url` — the API endpoint (REST/GraphQL tools only)
- `auth_header` — the auth header name, if present (REST/GraphQL tools only)
- `auth_secret` — the secret key name, if present (REST/GraphQL tools only)
- capabilities list under `### Capabilities`

Store the parsed tools as `<registered_tools>`.
</step>

<step name="check-versions">
For each tool in `<registered_tools>`:

If `<type>` is `rest` or `mcp`:
  Add to `<unchanged_tools>` — version checking is not applicable for REST/MCP tools.
  Continue to next tool.

If `<type>` is `graphql`:
  Run a GraphQL introspection query to detect schema changes.

  **IMPORTANT: Auth is OPTIONAL for GraphQL tools. Public APIs work without any secret. You MUST always attempt introspection regardless of whether auth is configured. NEVER skip a GraphQL tool just because it has no auth_secret.**

  1. Resolve the auth secret via Bash:
  ```bash
  node ~/.donna/donna-tools.cjs resolve-secret <auth_secret>
  ```
  Parse the JSON response. If `error` is `"key_not_found"` or `"placeholder_value"`, set `<resolved_secret>` to empty (no auth). Otherwise extract the `value` field as `<resolved_secret>`. **An empty resolved_secret is perfectly valid — proceed to step 2 regardless.**

  2. Run via Bash with a 15-second timeout (set the Bash tool's `timeout` parameter to `15000`). Include the auth header only when a real secret was resolved:
     - If `<resolved_secret>` is non-empty:
       ```bash
       curl -s -X POST \
         -H "<auth_header>: <resolved_secret>" \
         -H "Content-Type: application/json" \
         -d '{"query":"{ __schema { types { name fields { name type { name } } } } }"}' \
         "<base_url>" 2>&1
       ```
     - If `<resolved_secret>` is empty (public API or no secret configured):
       ```bash
       curl -s -X POST \
         -H "Content-Type: application/json" \
         -d '{"query":"{ __schema { types { name fields { name type { name } } } } }"}' \
         "<base_url>" 2>&1
       ```

  3. If the request fails (non-zero exit, timeout, or error response), add to `<unchanged_tools>` with note "introspection failed — skipped" and continue.

  4. If successful, compare the returned schema against stored capabilities:
     - Extract field names and types from the introspection response for the types/queries relevant to stored capabilities.
     - Check if any stored capability references fields that no longer exist in the schema (removed fields).
     - Check if the schema has new fields on types used by stored capabilities that might be useful.

  5. If no meaningful changes detected, add to `<unchanged_tools>`.

  6. If changes detected, add to `<changed_tools>` with a `<schema_changes>` annotation listing:
     - Removed fields (fields in stored capabilities no longer in schema)
     - New fields (fields in schema not referenced by any stored capability)

If `<type>` is `cli` (or absent; treat as `cli`):
  Run via Bash:
  ```bash
  <command> --version 2>/dev/null | head -1
  ```

  Compare the output against the stored `version` field using simple string equality — "is it different?" is sufficient; no semver parsing required.

  If `<command>` is not found (command fails), treat it as changed with a warning note.

  Add to:
  - `<changed_tools>` — installed version differs from stored version (or command not found)
  - `<unchanged_tools>` — installed version matches stored version exactly
</step>

<step name="report-unchanged">
For each tool in `<unchanged_tools>`:

If `<type>` is `rest` or `mcp`, print:
```
⊘ <tool_name>: <type> tool — re-learning not applicable (capabilities are user-defined)
```

If `<type>` is `graphql`, print using the skip reason from check-versions:
```
⊘ <tool_name>: graphql tool — <skip_reason>
```
Where `<skip_reason>` is "no schema changes detected" or "introspection failed — skipped".

Otherwise (CLI tools), print:
```
⊘ <tool_name>: unchanged at <version> — skipped
```

If ALL tools are in `<unchanged_tools>` (no changes found), print:
```
✓ All tools up to date. Nothing to re-learn.
```
Stop.
</step>

<step name="relearn-graphql">
For each graphql tool in `<changed_tools>`:

Print:
```
⚠ <tool_name>: schema changes detected
  Removed fields: <list or "none">
  New fields: <list or "none">
```

Use AskUserQuestion:
```
Update capabilities for <tool_name>?
```
Suggest "yes" and "no" as options.

If yes:
  Show the current capabilities and the detected changes side by side. Use AskUserQuestion to let the user update capabilities interactively (same editing loop as adjust-tool: "remove <number>", "add <name>: <query>", "edit <number> <new_query>", "done").

  Store the updated capabilities. Update `learned` date to today.

If no:
  Skip — keep existing capabilities unchanged. Update `learned` date to today (to avoid re-checking next run).
</step>

<step name="relearn-changed">
Note: Re-learning is supported for CLI tools (version-based) and GraphQL tools (schema introspection). REST and MCP tool capabilities are user-defined and not auto-learned.

For each tool in `<changed_tools>`, apply the same learn-capabilities logic as add-tool.md's learn-capabilities step.

Determine if the tool is well-known (gh, jira, kubectl) or unknown. For well-known tools, synthesize capabilities from training data. Do NOT parse --help for well-known tools.

**gh (GitHub CLI) — training data baseline:**
- list-assigned-prs: `gh search prs --assignee=@me --state=open --json number,title,url --limit 20`
- list-review-requests: `gh search prs --review-requested=@me --state=open --json number,title,url --limit 20`
- list-assigned-issues: `gh search issues --assignee=@me --state=open --json number,title,url --limit 20`

**jira (ankitpokhrel/jira-cli) — training data baseline:**
- list-sprint-issues: `jira sprint list --current -a$(jira me) --plain`
- list-my-issues: `jira issue list -a$(jira me) --plain`

**kubectl — training data baseline:**
- list-pods: `kubectl get pods --all-namespaces --field-selector=status.phase!=Succeeded -o wide`
- list-failing: `kubectl get pods --all-namespaces --field-selector=status.phase=Failed -o wide`

For **unknown tools**, use a cascading approach to re-learn capabilities. Each stage builds on the previous. The goal is to update CLI invocations for existing capability names — do NOT ask the user to re-select capabilities.

**Stage 1 — Local docs:**
Attempt to find local documentation for the tool:
```bash
TOOL_PATH=$(which <command> 2>/dev/null)
```
If found, check for README or docs in the tool's package directory:
```bash
TOOL_DIR=$(dirname "$(dirname "$TOOL_PATH")")
ls "$TOOL_DIR"/README* "$TOOL_DIR"/doc* "$TOOL_DIR"/docs* 2>/dev/null | head -5
```
If doc files exist, read up to 200 lines from the most relevant one. Use to update invocations for existing capability names.

**Stage 2 — CLI help (baseline):**
Run `<command> --help 2>&1 | head -80` via Bash. Combine with Stage 1 findings. Update invocations for existing capability names based on any changes to flags, subcommands, or output formats.

**Stage 3 — Web docs (if invocations could not be updated from stages 1-2):**
If any existing capability's invocation could not be validated from local docs or help output, attempt to fetch the tool's web documentation. Use WebFetch on common doc URLs:
- `https://<command>.dev` or `https://<command>.io`
- The homepage URL from `<command> --help` output if one was printed

**Stage 4 — Source code analysis (user opt-in per D-09):**
After stages 1-3, if the tool path was found, ask the user:

Use AskUserQuestion:
```
Updated <N> capability invocations from docs and help output. Want me to analyze <command>'s source code for additional capabilities?
```

If yes: read up to 500 lines from the main entry point or lib/ directory of the tool, identify new capabilities, and add to the list.
If no: continue with updated invocations.

Do NOT ask the user to re-select capabilities — keep the same capability names, update only the CLI invocations. The cascade's Stage 4 is the only place where NEW capabilities might be added (with user opt-in).

Get the new installed version:
```bash
<command> --version 2>/dev/null | head -1
```

Print:
```
✓ Re-learned <tool_name> (was <old_version>, now <new_version>)
```
</step>

<step name="write-tools-md">
Update `<storage_repo>/donna/tools.md`: for each re-learned tool, update its `version`, `learned` date (today's date YYYY-MM-DD), and capabilities section with the new invocations.

Upsert — replace only the re-learned tool sections, do not remove other tool sections. Preserve all unchanged tool sections exactly as they are.

Write the full file back with the Write tool.
</step>

<step name="git-commit">
Run via Bash:
```bash
node ~/.donna/donna-tools.cjs commit "donna(relearn-tools): updated <count> tool(s)" --files donna/tools.md
```
</step>

<step name="confirm">
Print summary:
```
✓ Re-learned <count> tool(s): <tool_names>
  <count> tool(s) unchanged: <tool_names>
```
</step>
