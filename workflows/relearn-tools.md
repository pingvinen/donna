# Donna Relearn-Tools Workflow

<objective>
Check each registered tool's installed version against its stored version and re-learn capabilities for tools that have been updated. Tools at the same version are skipped.
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

  1. Attempt to read `<storage_repo>/donna/secrets.md` with the Read tool. If the file exists and contains the `auth_secret` key with a value that is not a placeholder (does not contain "REPLACE_WITH"), set `<resolved_secret>` to that value. Otherwise, set `<resolved_secret>` to empty (no auth). **An empty resolved_secret is perfectly valid — proceed to step 2 regardless.**

  2. Run via Bash with a 15-second timeout. Include the auth header only when a real secret was resolved:
     - If `<resolved_secret>` is non-empty:
       ```bash
       timeout 15 curl -s -X POST \
         -H "<auth_header>: <resolved_secret>" \
         -H "Content-Type: application/json" \
         -d '{"query":"{ __schema { types { name fields { name type { name } } } } }"}' \
         "<base_url>" 2>&1
       ```
     - If `<resolved_secret>` is empty (public API or no secret configured):
       ```bash
       timeout 15 curl -s -X POST \
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

For **unknown tools**, run `<command> --help 2>&1 | head -80` via Bash and use Claude's understanding to identify 3–5 capabilities relevant to daily task management.

Do NOT ask the user to re-select capabilities — keep the same capability names, update only the CLI invocations if the training data suggests changes.

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
git -C <storage_repo> add -A
```

Check whether there is anything to commit:
```bash
git -C <storage_repo> status --porcelain
```

If the output is empty, skip the commit and continue.

Otherwise, run:
```bash
git -C <storage_repo> commit -m "donna(relearn-tools): updated <count> tool(s)"
```

If `auto_push` is true in config, also run:
```bash
git -C <storage_repo> push
```
</step>

<step name="confirm">
Print summary:
```
✓ Re-learned <count> tool(s): <tool_names>
  <count> tool(s) unchanged: <tool_names>
```
</step>
