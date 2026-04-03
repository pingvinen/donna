# Donna Adjust-Tool Workflow

<objective>
Edit an existing registered tool's configuration — scope, capabilities, auth/secrets, or command.
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
```
Store as `<change_choice>`.

**If the user asks to change the type** (response mentions "type", "change type", "switch type", etc.):
Print:
```
Tool type cannot be changed in-place — it affects how capabilities are learned and how the tool is invoked. To change a tool's type, remove and re-add:

1. /donna:remove-tool <tool_name>
2. /donna:add-tool <tool_name>
```
Stop — do not proceed to apply-change.
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

</step>

<step name="write-tools-md">
Read `<storage_repo>/donna/tools.md`. Update only the `<selected_tool>` section with the changed fields. Preserve all other tool sections unchanged. Write the full file back with the Write tool.
</step>

<step name="git-commit">
Run via Bash:
```bash
node ~/.donna/donna-tools.cjs commit "donna(adjust-tool): updated <tool_name> (<change_description>)" --files donna/tools.md
```
</step>

<step name="confirm">
Print:
```
! Updated <tool_name>:
  <field>: <old_value> -> <new_value>
```
</step>
