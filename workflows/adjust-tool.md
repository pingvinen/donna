# Donna Adjust-Tool Workflow

<objective>
Edit an existing registered tool's configuration — scope, capabilities, auth/secrets, command, or type.
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

After processing all pending migrations, update `~/.donna/state.md` with the Write tool: remove the completed entries from `pending_migrations`. If no entries remain, write:
```markdown
---
pending_migrations: []
---
```

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
Read `<storage_repo>/donna/tools.md` with the Read tool. If the file does not exist or has no tool sections, print:
```
! No tools registered. Run /donna:add-tool first.
```
Stop.

Parse each tool section (starting with `## <tool_name>`). For each tool, extract the `type` field (if absent, treat as "cli"), `command`, `version`, `learned`, `auth_test`, `scope`, and capabilities list under `### Capabilities`.

Store as `<registered_tools>`.
</step>

<step name="select-tool">
If a tool name was provided as argument (e.g., `/donna:adjust-tool gh`), look it up in `<registered_tools>`. If not found, print `! Tool "<name>" not found in tools.md` and stop.

If no argument was provided, list all registered tools via AskUserQuestion:
```
Which tool would you like to adjust?

<numbered list of tool names from registered_tools>
```
Store the selected tool as `<selected_tool>`.
</step>

<step name="show-current-config">
Display the current configuration of `<selected_tool>`:
```
Current configuration for <tool_name>:

  command:   <command>
  type:      <type>
  version:   <version>
  learned:   <learned>
  auth_test: <auth_test>
  scope:     <scope>

  Capabilities:
  - <name>: <invocation>
  - ...
```
</step>

<step name="ask-what-to-change">
Use AskUserQuestion:
```
What would you like to change?

1. scope — filtering context (orgs, repos, projects, namespaces)
2. capabilities — add, remove, or modify capability commands
3. command — the CLI command or base URL
4. auth — auth test command or API secrets
5. type — tool type (cli, rest, graphql, mcp)
```
Store as `<change_choice>`.
</step>

<step name="apply-change">
Based on `<change_choice>`:

**1. scope:**
Show current scope. Use AskUserQuestion: `New scope for <tool_name>? (current: <scope>)`. Store new value.
Then ask via AskUserQuestion: `Scope changed. Re-learn capabilities with new scope? (yes/no)`.
If yes, run the same learn-capabilities logic as add-tool.md (well-known baselines for gh/jira/kubectl, `--help` parse for unknown tools), incorporating the new scope into CLI invocations.

**2. capabilities:**
Show current capabilities numbered. Use AskUserQuestion:
```
Current capabilities:
1. <name>: <invocation>
2. ...

Type "remove <number>" to remove, "add <name>: <command>" to add, or "edit <number> <new_command>" to modify.
```
Apply the change. Allow multiple edits — keep asking until user says "done".

**3. command:**
Use AskUserQuestion: `New command for <tool_name>? (current: <command>)`. Store new value.
Verify installation: `which <new_command>` via Bash. Print result.

**4. auth:**
For type=cli: Use AskUserQuestion to update auth_test command.
For type=rest|graphql: Print `Edit your secrets in <storage_repo>/donna/secrets.md directly. The auth_secret field references the key name in that file.` Use AskUserQuestion to update `auth_secret` field name if needed.
For type=mcp: Print `MCP server auth is managed in Claude Code settings, not in Donna.`

**5. type:**
Use AskUserQuestion: `New type for <tool_name>? (cli, rest, graphql, mcp) (current: <type>)`. Store new value.
Warn if changing from cli to api/mcp: `Changing type will require updating capabilities format. Proceed? (yes/no)`.
</step>

<step name="write-tools-md">
Read `<storage_repo>/donna/tools.md`. Update only the `<selected_tool>` section with the changed fields. Preserve all other tool sections unchanged. Write the full file back with the Write tool.
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
git -C <storage_repo> commit -m "donna(adjust-tool): updated <tool_name> (<change_description>)"
```

If `auto_push` is true in config, also run:
```bash
git -C <storage_repo> push
```
</step>

<step name="confirm">
Print:
```
! Updated <tool_name>:
  <field>: <old_value> -> <new_value>
```
</step>
